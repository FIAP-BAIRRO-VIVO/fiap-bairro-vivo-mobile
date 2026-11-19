import { jaVotouNoCiclo, registrarAtualizacao } from '@/domain/atualizacaoRules';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type {
  Atualizacao,
  AtualizacaoInput,
  HistoricoStatus,
  Ocorrencia,
  ResultadoAtualizacao,
} from '@/models';
import { sessaoAtual } from '@/storage/sessionStore';
import { gravarVarios, KEYS, lerJSON } from '@/storage/storage';

import type { AtualizacaoService } from '../types';

import {
  agoraISO,
  comErroPadrao,
  exigirSessao,
  limitarEscritas,
  novoId,
  simularRede,
} from './util';

export class LocalAtualizacaoService implements AtualizacaoService {
  async listar(idOcorrencia: string): Promise<Atualizacao[]> {
    await simularRede(120);
    const todas = await lerJSON<Atualizacao[]>(KEYS.atualizacoes, []);
    return todas
      .filter((a) => a.idOcorrencia === idOcorrencia)
      .sort((a, b) => b.dtCriacao.localeCompare(a.dtCriacao));
  }

  async enviar(idOcorrencia: string, input: AtualizacaoInput): Promise<ResultadoAtualizacao> {
    await simularRede();
    const { usuario } = await exigirSessao();
    const [ocorrencias, atualizacoes, historico] = await Promise.all([
      lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []),
      lerJSON<Atualizacao[]>(KEYS.atualizacoes, []),
      lerJSON<HistoricoStatus[]>(KEYS.historico, []),
    ]);
    const ocorrencia = ocorrencias.find((o) => o.id === idOcorrencia);
    if (!ocorrencia || ocorrencia.excluida) throw new ServiceError(404, MENSAGENS.naoEncontrada);

    // Regras puras (valida, conta voto, 409 em voto repetido, muda status na 2ª confirmação).
    const resultado = registrarAtualizacao({
      ocorrencia,
      atualizacoes,
      input,
      usuario,
      idAtualizacao: novoId('at'),
      idHistorico: novoId('hi'),
      agora: agoraISO(),
      urlFotoEvidencia: input.foto?.uri,
    });
    limitarEscritas(usuario.id);

    // Ocorrência, atualização e histórico gravados numa única operação de escrita.
    await comErroPadrao(() =>
      gravarVarios([
        [
          KEYS.ocorrencias,
          ocorrencias.map((o) => (o.id === idOcorrencia ? resultado.ocorrencia : o)),
        ],
        [KEYS.atualizacoes, [...atualizacoes, resultado.atualizacao]],
        [KEYS.historico, resultado.historico ? [...historico, resultado.historico] : historico],
      ]),
    );
    return resultado;
  }

  async jaVotei(idOcorrencia: string): Promise<boolean> {
    const s = sessaoAtual();
    if (!s) return false;
    const [ocorrencias, atualizacoes] = await Promise.all([
      lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []),
      lerJSON<Atualizacao[]>(KEYS.atualizacoes, []),
    ]);
    const o = ocorrencias.find((x) => x.id === idOcorrencia);
    return !!o && jaVotouNoCiclo(o, atualizacoes, s.idUsuario);
  }

  async resumoDaConta() {
    const { usuario } = await exigirSessao();
    const [atualizacoes, historico] = await Promise.all([
      lerJSON<Atualizacao[]>(KEYS.atualizacoes, []),
      lerJSON<HistoricoStatus[]>(KEYS.historico, []),
    ]);
    const minhas = atualizacoes.filter((a) => a.idAutor === usuario.id);
    // Resolvidas com ajuda: ciclos que viraram RESOLVIDA e tiveram voto desta conta.
    const resolvidas = new Set<string>();
    for (const h of historico) {
      if (h.statusNovo !== 'RESOLVIDA') continue;
      const votou = minhas.some(
        (a) =>
          a.idOcorrencia === h.idOcorrencia &&
          a.contabilizadaComoVoto &&
          a.numeroCiclo === h.cicloAnterior,
      );
      if (votou) resolvidas.add(`${h.idOcorrencia}:${h.cicloNovo}`);
    }
    return { atualizacoes: minhas.length, resolvidasComAjuda: resolvidas.size };
  }
}
