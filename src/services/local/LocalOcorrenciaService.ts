import { MENSAGENS, ServiceError } from '@/domain/erros';
import {
  aplicarEdicao,
  criarOcorrencia,
  excluirLogicamente,
  garantirCidadao,
  temErros,
  validarOcorrencia,
} from '@/domain/ocorrenciaRules';
import type {
  Categoria,
  FiltroOcorrencias,
  FotoInput,
  HistoricoStatus,
  Midia,
  Municipio,
  Ocorrencia,
  OcorrenciaInput,
  Pagina,
} from '@/models';
import { gravarJSON, KEYS, lerJSON } from '@/storage/storage';

import type { OcorrenciaService } from '../types';

import {
  agoraISO,
  comErroPadrao,
  exigirSessao,
  limitarEscritas,
  novoId,
  simularRede,
} from './util';

function aplicarFiltro(lista: Ocorrencia[], f: FiltroOcorrencias = {}): Ocorrencia[] {
  let r = lista.filter((o) => !o.excluida);
  if (f.status) r = r.filter((o) => o.status === f.status);
  if (f.categoriaId) r = r.filter((o) => o.categoria.id === f.categoriaId);
  if (f.municipioId) r = r.filter((o) => o.municipio.id === f.municipioId);
  const ordem = f.ordem ?? 'RECENTES';
  const porData = (a: Ocorrencia, b: Ocorrencia) => b.dtCriacao.localeCompare(a.dtCriacao);
  if (ordem === 'RECENTES') r.sort(porData);
  else if (ordem === 'ANTIGAS') r.sort((a, b) => -porData(a, b));
  else r.sort((a, b) => b.totalVotosCiclo - a.totalVotosCiclo || porData(a, b));
  return r;
}

function midiasDe(fotos: FotoInput[], existentes: Midia[] = []): Midia[] {
  return fotos.map((f, i) => {
    const antiga = existentes.find((m) => m.urlExibicao === f.uri);
    return {
      id: antiga?.id ?? novoId('mid'),
      urlExibicao: f.uri,
      mimeType: f.mimeType ?? antiga?.mimeType ?? 'image/jpeg',
      principal: i === 0,
    };
  });
}

export class LocalOcorrenciaService implements OcorrenciaService {
  private async todas(): Promise<Ocorrencia[]> {
    return lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []);
  }

  async listar(filtro: FiltroOcorrencias = {}): Promise<Pagina<Ocorrencia>> {
    await simularRede();
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const tamanho = Math.max(1, filtro.tamanho ?? 10);
    const lista = aplicarFiltro(await this.todas(), filtro);
    const inicio = (pagina - 1) * tamanho;
    return { itens: lista.slice(inicio, inicio + tamanho), pagina, tamanho, total: lista.length };
  }

  async listarTodas(filtro: Omit<FiltroOcorrencias, 'pagina' | 'tamanho'> = {}) {
    await simularRede();
    return aplicarFiltro(await this.todas(), filtro);
  }

  async obter(id: string): Promise<Ocorrencia> {
    await simularRede();
    const o = (await this.todas()).find((x) => x.id === id);
    if (!o || o.excluida) throw new ServiceError(404, MENSAGENS.naoEncontrada);
    return o;
  }

  async historico(id: string): Promise<HistoricoStatus[]> {
    const h = await lerJSON<HistoricoStatus[]>(KEYS.historico, []);
    return h
      .filter((x) => x.idOcorrencia === id)
      .sort((a, b) => a.dtEvento.localeCompare(b.dtEvento));
  }

  async minhas(): Promise<Ocorrencia[]> {
    await simularRede();
    const { usuario } = await exigirSessao();
    return (await this.todas())
      .filter((o) => o.idAutor === usuario.id && !o.excluida)
      .sort((a, b) => b.dtCriacao.localeCompare(a.dtCriacao));
  }

  private async referencias() {
    const [categorias, municipios] = await Promise.all([
      lerJSON<Categoria[]>(KEYS.categorias, []),
      lerJSON<Municipio[]>(KEYS.municipios, []),
    ]);
    return { categorias, municipios };
  }

  async criar(input: OcorrenciaInput): Promise<Ocorrencia> {
    await simularRede();
    const { usuario } = await exigirSessao();
    garantirCidadao(usuario.perfil);
    const { categorias, municipios } = await this.referencias();
    const erros = validarOcorrencia(input, categorias, municipios);
    if (temErros(erros)) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
    limitarEscritas(usuario.id);

    return comErroPadrao(async () => {
      const nova = criarOcorrencia({
        id: novoId('oc'),
        input,
        autor: usuario,
        categoria: categorias.find((c) => c.id === input.idCategoria) as Categoria,
        municipio: municipios.find((m) => m.id === input.idMunicipio) as Municipio,
        midias: midiasDe(input.fotos),
        agora: agoraISO(),
      });
      await gravarJSON(KEYS.ocorrencias, [...(await this.todas()), nova]);
      return nova;
    });
  }

  async editar(id: string, input: OcorrenciaInput): Promise<Ocorrencia> {
    await simularRede();
    const { usuario } = await exigirSessao();
    const lista = await this.todas();
    const atual = lista.find((x) => x.id === id);
    if (!atual || atual.excluida) throw new ServiceError(404, MENSAGENS.naoEncontrada);
    if (atual.idAutor !== usuario.id) throw new ServiceError(403, MENSAGENS.soAutor);

    const { categorias, municipios } = await this.referencias();
    const erros = validarOcorrencia(input, categorias, municipios, atual.categoria.id);
    if (temErros(erros)) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
    limitarEscritas(usuario.id);

    return comErroPadrao(async () => {
      const editada = aplicarEdicao({
        ocorrencia: atual,
        input,
        idUsuario: usuario.id,
        nomeAutor: usuario.nome,
        categoria: categorias.find((c) => c.id === input.idCategoria) as Categoria,
        municipio: municipios.find((m) => m.id === input.idMunicipio) as Municipio,
        midias: midiasDe(input.fotos, atual.midias),
        agora: agoraISO(),
      });
      await gravarJSON(
        KEYS.ocorrencias,
        lista.map((o) => (o.id === id ? editada : o)),
      );
      return editada;
    });
  }

  async excluir(id: string): Promise<void> {
    await simularRede();
    const { usuario } = await exigirSessao();
    const lista = await this.todas();
    const atual = lista.find((x) => x.id === id);
    if (!atual || atual.excluida) throw new ServiceError(404, MENSAGENS.naoEncontrada);
    const excluida = excluirLogicamente(atual, usuario.id, agoraISO());
    await gravarJSON(
      KEYS.ocorrencias,
      lista.map((o) => (o.id === id ? excluida : o)),
    );
  }
}
