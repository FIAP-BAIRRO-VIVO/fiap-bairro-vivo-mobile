import type {
  Atualizacao,
  AtualizacaoInput,
  HistoricoStatus,
  Ocorrencia,
  StatusOcorrencia,
  TipoAtualizacao,
  UsuarioPublico,
} from '@/models';

import { MENSAGENS, ServiceError } from './erros';
import { exibicaoAutor, garantirCidadao } from './ocorrenciaRules';

/** Quantas confirmações de contas diferentes mudam o status. */
export const VOTOS_PARA_MUDAR = 2;

/**
 * RESOLVIDO conta como voto só com a ocorrência ABERTA; PERSISTE só com ela RESOLVIDA.
 * Nos outros casos vira apenas evidência. COMENTARIO nunca conta.
 */
export function contaComoVoto(tipo: TipoAtualizacao, status: StatusOcorrencia): boolean {
  if (tipo === 'RESOLVIDO') return status === 'ABERTA';
  if (tipo === 'PERSISTE') return status === 'RESOLVIDA';
  return false;
}

/** Para onde o voto empurra a ocorrência no estado atual. */
export function alvoDoVoto(status: StatusOcorrencia): 'resolver' | 'reabrir' {
  return status === 'ABERTA' ? 'resolver' : 'reabrir';
}

export function statusOposto(status: StatusOcorrencia): StatusOcorrencia {
  return status === 'ABERTA' ? 'RESOLVIDA' : 'ABERTA';
}

/** Votos válidos do ciclo atual (uma conta conta uma vez). */
export function votosDoCiclo(ocorrencia: Ocorrencia, atualizacoes: Atualizacao[]): Atualizacao[] {
  return atualizacoes.filter(
    (a) =>
      a.idOcorrencia === ocorrencia.id &&
      a.numeroCiclo === ocorrencia.numeroCiclo &&
      a.contabilizadaComoVoto,
  );
}

export function jaVotouNoCiclo(
  ocorrencia: Ocorrencia,
  atualizacoes: Atualizacao[],
  idUsuario: string | undefined,
): boolean {
  if (!idUsuario) return false;
  return votosDoCiclo(ocorrencia, atualizacoes).some((a) => a.idAutor === idUsuario);
}

export type ErrosAtualizacao = Partial<Record<'tipo' | 'texto', string>>;

export function validarAtualizacao(input: AtualizacaoInput): ErrosAtualizacao {
  const erros: ErrosAtualizacao = {};
  if (!['COMENTARIO', 'PERSISTE', 'RESOLVIDO'].includes(input.tipo))
    erros.tipo = 'Escolha o que você viu.';
  const texto = input.texto?.trim() ?? '';
  if (input.tipo === 'COMENTARIO' && !texto && !input.foto)
    erros.texto = 'Escreva um comentário ou adicione uma foto.';
  if (texto.length > 1000) erros.texto = 'Use no máximo 1000 caracteres.';
  return erros;
}

/**
 * Registra uma atualização e, se for a 2ª confirmação de contas diferentes no ciclo,
 * muda o status, incrementa o ciclo, zera a contagem e gera o HistoricoStatus.
 * Função pura: o serviço grava o resultado numa única escrita.
 */
export function registrarAtualizacao(params: {
  ocorrencia: Ocorrencia;
  atualizacoes: Atualizacao[];
  input: AtualizacaoInput;
  usuario: UsuarioPublico;
  idAtualizacao: string;
  idHistorico: string;
  agora: string;
  urlFotoEvidencia?: string;
}): { atualizacao: Atualizacao; ocorrencia: Ocorrencia; historico?: HistoricoStatus } {
  const { ocorrencia, atualizacoes, input, usuario, idAtualizacao, idHistorico, agora } = params;
  garantirCidadao(usuario.perfil);
  if (ocorrencia.excluida) throw new ServiceError(404, MENSAGENS.naoEncontrada);

  const erros = validarAtualizacao(input);
  if (Object.keys(erros).length > 0) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);

  const voto = contaComoVoto(input.tipo, ocorrencia.status);
  if (voto && jaVotouNoCiclo(ocorrencia, atualizacoes, usuario.id)) {
    throw new ServiceError(409, MENSAGENS.votoRepetido);
  }

  const atualizacao: Atualizacao = {
    id: idAtualizacao,
    idOcorrencia: ocorrencia.id,
    tipo: input.tipo,
    texto: input.texto?.trim() || undefined,
    idAutor: usuario.id,
    autorExibicao: exibicaoAutor(usuario.nome, input.anonimoPublico),
    anonimoPublico: input.anonimoPublico,
    contabilizadaComoVoto: voto,
    statusAtual: ocorrencia.status,
    numeroCiclo: ocorrencia.numeroCiclo,
    dtCriacao: agora,
    urlFotoEvidencia: params.urlFotoEvidencia,
  };

  if (!voto) {
    return { atualizacao, ocorrencia: { ...ocorrencia, dtAtualizacao: agora } };
  }

  const eleitores = new Set(votosDoCiclo(ocorrencia, atualizacoes).map((a) => a.idAutor));
  eleitores.add(usuario.id);

  if (eleitores.size < VOTOS_PARA_MUDAR) {
    return {
      atualizacao,
      ocorrencia: { ...ocorrencia, totalVotosCiclo: eleitores.size, dtAtualizacao: agora },
    };
  }

  const statusNovo = statusOposto(ocorrencia.status);
  const historico: HistoricoStatus = {
    id: idHistorico,
    idOcorrencia: ocorrencia.id,
    statusAnterior: ocorrencia.status,
    statusNovo,
    cicloAnterior: ocorrencia.numeroCiclo,
    cicloNovo: ocorrencia.numeroCiclo + 1,
    dtEvento: agora,
  };
  return {
    atualizacao,
    historico,
    ocorrencia: {
      ...ocorrencia,
      status: statusNovo,
      numeroCiclo: ocorrencia.numeroCiclo + 1,
      totalVotosCiclo: 0,
      dtAtualizacao: agora,
    },
  };
}
