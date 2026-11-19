// Integração com a API .NET (ocorrências).
//   GET    /api/ocorrencias?pagina&tamanho&categoriaId&municipioId&status&ordem
//   GET    /api/ocorrencias/{id}
//   GET    /api/ocorrencias/{id}/historico
//   GET    /api/ocorrencias/minhas
//   POST   /api/ocorrencias            (Idempotency-Key)
//   PUT    /api/ocorrencias/{id}
//   DELETE /api/ocorrencias/{id}       (exclusão lógica)
//   POST   /api/ocorrencias/{id}/midias (só URLs já hospedadas — STANDBY upload)

import { MENSAGENS, ServiceError } from '@/domain/erros';
import { garantirCidadao, temErros, validarOcorrencia } from '@/domain/ocorrenciaRules';
import type {
  FiltroOcorrencias,
  HistoricoStatus,
  Ocorrencia,
  OcorrenciaInput,
  Pagina,
} from '@/models';
import { carregarSessao } from '@/storage/sessionStore';

import type { OcorrenciaService } from '../types';

import { ApiDotnetCategoriaService } from './ApiDotnetCategoriaService';
import { ApiDotnetMunicipioService } from './ApiDotnetMunicipioService';
import { apiDotnet } from './http';
import {
  HistoricoDto,
  historicoDoApp,
  OcorrenciaDto,
  ocorrenciaDoApp,
  PaginaDto,
} from './mapeadores';

const ORDEM_API: Record<string, string> = { RECENTES: 'recentes', ANTIGAS: 'antigas' };
const LIMITE_LISTA = 200;

type ItemDto = { ocorrencia: OcorrenciaDto };

export class ApiDotnetOcorrenciaService implements OcorrenciaService {
  private categorias = new ApiDotnetCategoriaService();
  private municipios = new ApiDotnetMunicipioService();

  /** Ids das ocorrências da conta logada (a resposta pública não traz o autor). */
  private async idsMinhas(): Promise<{ idUsuario: string; ids: Set<string> } | null> {
    const sessao = await carregarSessao();
    if (!sessao || sessao.perfil !== 'CIDADAO') return null;
    try {
      const r = await apiDotnet<PaginaDto<ItemDto>>('GET', '/api/ocorrencias/minhas', {
        auth: 'obrigatoria',
        query: { pagina: 1, tamanho: LIMITE_LISTA },
      });
      return {
        idUsuario: sessao.idUsuario,
        ids: new Set(r.dados.map((d) => String(d.ocorrencia.id))),
      };
    } catch {
      return null;
    }
  }

  async listar(filtro: FiltroOcorrencias = {}): Promise<Pagina<Ocorrencia>> {
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const tamanho = Math.max(1, filtro.tamanho ?? 10);
    const base = {
      status: filtro.status,
      categoriaId: filtro.categoriaId,
      municipioId: filtro.municipioId,
    };

    // A API não ordena por votos: busca tudo e ordena aqui.
    if (filtro.ordem === 'MAIS_VOTADAS') {
      const todas = await this.listarTodas(base);
      todas.sort(
        (a, b) => b.totalVotosCiclo - a.totalVotosCiclo || b.dtCriacao.localeCompare(a.dtCriacao),
      );
      const inicio = (pagina - 1) * tamanho;
      return { itens: todas.slice(inicio, inicio + tamanho), pagina, tamanho, total: todas.length };
    }

    const r = await apiDotnet<PaginaDto<ItemDto>>('GET', '/api/ocorrencias', {
      query: { ...base, pagina, tamanho, ordem: ORDEM_API[filtro.ordem ?? 'RECENTES'] },
    });
    return {
      itens: r.dados.map((d) => ocorrenciaDoApp(d.ocorrencia)),
      pagina: r.pagina,
      tamanho: r.tamanho,
      total: r.total,
    };
  }

  async listarTodas(
    filtro: Omit<FiltroOcorrencias, 'pagina' | 'tamanho'> = {},
  ): Promise<Ocorrencia[]> {
    const itens: Ocorrencia[] = [];
    for (let pagina = 1; pagina <= 10; pagina++) {
      const r = await apiDotnet<PaginaDto<ItemDto>>('GET', '/api/ocorrencias', {
        query: {
          pagina,
          tamanho: LIMITE_LISTA,
          status: filtro.status,
          categoriaId: filtro.categoriaId,
          municipioId: filtro.municipioId,
          ordem: ORDEM_API[filtro.ordem ?? 'RECENTES'] ?? 'recentes',
        },
      });
      itens.push(...r.dados.map((d) => ocorrenciaDoApp(d.ocorrencia)));
      if (itens.length >= r.total || r.dados.length === 0) break;
    }
    return itens;
  }

  async obter(id: string): Promise<Ocorrencia> {
    const [dto, minhas] = await Promise.all([
      apiDotnet<OcorrenciaDto>('GET', `/api/ocorrencias/${encodeURIComponent(id)}`),
      this.idsMinhas(),
    ]);
    const idAutor = minhas?.ids.has(String(dto.id)) ? minhas.idUsuario : '';
    return ocorrenciaDoApp(dto, idAutor);
  }

  async historico(id: string): Promise<HistoricoStatus[]> {
    const lista = await apiDotnet<HistoricoDto[]>(
      'GET',
      `/api/ocorrencias/${encodeURIComponent(id)}/historico`,
    );
    return historicoDoApp(lista ?? []);
  }

  async minhas(): Promise<Ocorrencia[]> {
    const sessao = await carregarSessao();
    const r = await apiDotnet<PaginaDto<ItemDto>>('GET', '/api/ocorrencias/minhas', {
      auth: 'obrigatoria',
      query: { pagina: 1, tamanho: LIMITE_LISTA, ordem: 'recentes' },
    });
    return r.dados.map((d) => ocorrenciaDoApp(d.ocorrencia, sessao?.idUsuario ?? ''));
  }

  /** Valida no app antes de enviar, para mostrar o erro embaixo do campo certo. */
  private async validar(input: OcorrenciaInput, categoriaAtualId?: string) {
    const [categorias, municipios] = await Promise.all([
      this.categorias.listar(true),
      this.municipios.listar(),
    ]);
    const erros = validarOcorrencia(input, categorias, municipios, categoriaAtualId);
    if (temErros(erros)) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
  }

  private corpo(input: OcorrenciaInput) {
    return {
      categoriaId: Number(input.idCategoria),
      municipioId: Number(input.idMunicipio),
      titulo: input.titulo.trim(),
      descricao: input.descricao.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      enderecoReferencia: input.enderecoReferencia?.trim() || null,
      anonimoPublico: input.anonimoPublico,
    };
  }

  /** Só fotos já hospedadas (http/https) podem ir para a API. STANDBY: upload. */
  private async enviarFotos(id: string, input: OcorrenciaInput, existentes: string[] = []) {
    const hospedadas = input.fotos.filter(
      (f) => /^https?:\/\//.test(f.uri) && !existentes.includes(f.uri),
    );
    for (const [i, f] of hospedadas.entries()) {
      await apiDotnet('POST', `/api/ocorrencias/${id}/midias`, {
        auth: 'obrigatoria',
        body: {
          provedor: 'URL_EXTERNA',
          chaveStorage: `app/${id}/${Date.now()}-${i}`,
          urlExibicao: f.uri,
          mimeType: f.mimeType ?? 'image/jpeg',
          tamanhoBytes: 0,
          tipoMidia: 'FOTO',
          principal: existentes.length === 0 && i === 0 ? 'S' : 'N',
        },
      });
    }
  }

  async criar(input: OcorrenciaInput): Promise<Ocorrencia> {
    const sessao = await carregarSessao();
    if (!sessao) throw new ServiceError(401, MENSAGENS.naoAutenticado);
    garantirCidadao(sessao.perfil);
    await this.validar(input);
    const dto = await apiDotnet<OcorrenciaDto>('POST', '/api/ocorrencias', {
      auth: 'obrigatoria',
      idempotente: true,
      body: this.corpo(input),
    });
    await this.enviarFotos(String(dto.id), input);
    return input.fotos.length ? this.obter(String(dto.id)) : ocorrenciaDoApp(dto, sessao.idUsuario);
  }

  async editar(id: string, input: OcorrenciaInput): Promise<Ocorrencia> {
    const atual = await this.obter(id);
    await this.validar(input, atual.categoria.id);
    await apiDotnet('PUT', `/api/ocorrencias/${encodeURIComponent(id)}`, {
      auth: 'obrigatoria',
      body: this.corpo(input),
    });
    await this.enviarFotos(
      id,
      input,
      atual.midias.map((m) => m.urlExibicao),
    );
    return this.obter(id);
  }

  async excluir(id: string): Promise<void> {
    await apiDotnet('DELETE', `/api/ocorrencias/${encodeURIComponent(id)}`, {
      auth: 'obrigatoria',
    });
  }
}
