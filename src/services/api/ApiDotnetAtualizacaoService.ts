// Integração com a API .NET (atualizações e votos).
//   GET  /api/ocorrencias/{id}/atualizacoes?pagina&tamanho
//   POST /api/ocorrencias/{id}/atualizacoes   (Idempotency-Key)
// A contagem de votos e a mudança de status são feitas pela API.

import { contaComoVoto, validarAtualizacao } from '@/domain/atualizacaoRules';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import { garantirCidadao } from '@/domain/ocorrenciaRules';
import type { Atualizacao, AtualizacaoInput, ResultadoAtualizacao } from '@/models';
import { lerRegistro, registrar } from '@/storage/registroApi';
import { carregarSessao } from '@/storage/sessionStore';

import type { AtualizacaoService } from '../types';

import { apiDotnet } from './http';
import {
  AtualizacaoDto,
  atualizacaoDoApp,
  OcorrenciaDto,
  ocorrenciaDoApp,
  PaginaDto,
} from './mapeadores';

async function buscarOcorrencia(id: string) {
  return ocorrenciaDoApp(
    await apiDotnet<OcorrenciaDto>('GET', `/api/ocorrencias/${encodeURIComponent(id)}`),
  );
}

export class ApiDotnetAtualizacaoService implements AtualizacaoService {
  async listar(idOcorrencia: string): Promise<Atualizacao[]> {
    const [r, sessao] = await Promise.all([
      apiDotnet<PaginaDto<AtualizacaoDto>>(
        'GET',
        `/api/ocorrencias/${encodeURIComponent(idOcorrencia)}/atualizacoes`,
        { query: { pagina: 1, tamanho: 100 } },
      ),
      carregarSessao(),
    ]);
    // A API não devolve o autor; marca como "você" o que esta conta enviou deste aparelho.
    const minhas = sessao
      ? new Set((await lerRegistro(sessao.idUsuario)).map((x) => x.idAtualizacao))
      : new Set<string>();
    return r.dados
      .map((a) => atualizacaoDoApp(a, minhas.has(String(a.id)) ? (sessao?.idUsuario ?? '') : ''))
      .sort((a, b) => b.dtCriacao.localeCompare(a.dtCriacao));
  }

  async enviar(idOcorrencia: string, input: AtualizacaoInput): Promise<ResultadoAtualizacao> {
    const sessao = await carregarSessao();
    if (!sessao) throw new ServiceError(401, MENSAGENS.naoAutenticado);
    garantirCidadao(sessao.perfil);

    // A API aceita comentário vazio; a regra do app não.
    const erros = validarAtualizacao(input);
    if (Object.keys(erros).length) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);

    const antes = await buscarOcorrencia(idOcorrencia);
    const voto = contaComoVoto(input.tipo, antes.status);
    if (voto && (await this.votouNoCiclo(sessao.idUsuario, idOcorrencia, antes.numeroCiclo))) {
      throw new ServiceError(409, MENSAGENS.votoRepetido);
    }

    const foto = input.foto?.uri && /^https?:\/\//.test(input.foto.uri) ? input.foto.uri : null;
    let dto: AtualizacaoDto;
    try {
      dto = await apiDotnet<AtualizacaoDto>(
        'POST',
        `/api/ocorrencias/${encodeURIComponent(idOcorrencia)}/atualizacoes`,
        {
          auth: 'obrigatoria',
          idempotente: true,
          body: {
            tipo: input.tipo,
            texto: input.texto?.trim() || null,
            anonimoPublico: input.anonimoPublico,
            urlFotoEvidencia: foto,
          },
        },
      );
    } catch (e) {
      // A API responde 500 (e não 409) ao voto repetido feito por outro aparelho.
      if (voto && e instanceof ServiceError && e.status === 500) {
        throw new ServiceError(
          409,
          'Não deu para registrar sua confirmação. Se você já confirmou neste ciclo, agora falta outro vizinho.',
        );
      }
      throw e;
    }

    const atualizacao = atualizacaoDoApp(dto, sessao.idUsuario);
    await registrar({
      idUsuario: sessao.idUsuario,
      idOcorrencia,
      idAtualizacao: atualizacao.id,
      tipo: atualizacao.tipo,
      numeroCiclo: atualizacao.numeroCiclo,
      voto: atualizacao.contabilizadaComoVoto,
      dtCriacao: atualizacao.dtCriacao,
    });

    const depois = await buscarOcorrencia(idOcorrencia);
    const mudou = depois.numeroCiclo > atualizacao.numeroCiclo || depois.status !== antes.status;
    return {
      atualizacao,
      ocorrencia: depois,
      historico: mudou
        ? {
            id: `api-${atualizacao.id}`,
            idOcorrencia,
            statusAnterior: antes.status,
            statusNovo: depois.status,
            cicloAnterior: antes.numeroCiclo,
            cicloNovo: depois.numeroCiclo,
            dtEvento: atualizacao.dtCriacao,
          }
        : undefined,
    };
  }

  private async votouNoCiclo(idUsuario: string, idOcorrencia: string, ciclo: number) {
    return (await lerRegistro(idUsuario)).some(
      (r) => r.idOcorrencia === idOcorrencia && r.voto && r.numeroCiclo === ciclo,
    );
  }

  /** STANDBY: a API não informa se a conta já votou; usa o registro deste aparelho. */
  async jaVotei(idOcorrencia: string): Promise<boolean> {
    const sessao = await carregarSessao();
    if (!sessao) return false;
    const registro = await lerRegistro(sessao.idUsuario);
    if (!registro.some((r) => r.idOcorrencia === idOcorrencia && r.voto)) return false;
    const o = await buscarOcorrencia(idOcorrencia);
    return this.votouNoCiclo(sessao.idUsuario, idOcorrencia, o.numeroCiclo);
  }

  /** STANDBY: contadores do perfil a partir do que esta conta enviou deste aparelho. */
  async resumoDaConta() {
    const sessao = await carregarSessao();
    if (!sessao) throw new ServiceError(401, MENSAGENS.naoAutenticado);
    const registro = await lerRegistro(sessao.idUsuario);
    const votosResolvido = registro.filter((r) => r.voto && r.tipo === 'RESOLVIDO');
    let resolvidasComAjuda = 0;
    for (const v of votosResolvido) {
      try {
        const o = await buscarOcorrencia(v.idOcorrencia);
        if (o.numeroCiclo > v.numeroCiclo) resolvidasComAjuda += 1;
      } catch {
        // Ocorrência excluída: não conta.
      }
    }
    return { atualizacoes: registro.length, resolvidasComAjuda };
  }
}
