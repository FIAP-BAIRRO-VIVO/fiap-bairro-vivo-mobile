// STANDBY: a orientação final virá da API Java (Spring AI + RAG).
// Hoje lê só a base local `src/storage/orientacoes.json`, por categoria, para São Paulo.
// A ocorrência vem da fonte ativa (local ou API .NET).

import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { Ocorrencia, OrientacaoCidada } from '@/models';
import base from '@/storage/orientacoes.json';
import { KEYS, lerJSON } from '@/storage/storage';

import type { OrientacaoService } from '../types';

import { simularRede } from './util';

type Entrada = Pick<
  OrientacaoCidada,
  'orgaoResponsavel' | 'servico' | 'canais' | 'passos' | 'cuidados'
>;

const categorias = base.categorias as unknown as Record<string, Entrada>;
const fontesExtras = base.fontesPorCategoria as unknown as Record<
  string,
  OrientacaoCidada['fontes']
>;

async function ocorrenciaLocal(id: string): Promise<Ocorrencia> {
  const ocorrencias = await lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []);
  const o = ocorrencias.find((x) => x.id === id && !x.excluida);
  if (!o) throw new ServiceError(404, MENSAGENS.naoEncontrada);
  return o;
}

export class LocalOrientacaoService implements OrientacaoService {
  constructor(private obterOcorrencia: (id: string) => Promise<Ocorrencia> = ocorrenciaLocal) {}

  async obter(idOcorrencia: string): Promise<OrientacaoCidada> {
    // Um pouco mais lento, como uma consulta de IA.
    const [o] = await Promise.all([this.obterOcorrencia(idOcorrencia), simularRede(900)]);

    const vazia: OrientacaoCidada = {
      id: `ori-${o.id}`,
      ocorrenciaId: o.id,
      estado: 'SEM_FONTE',
      canais: [],
      passos: [],
      cuidados: [],
      fontes: [],
      geradaEm: new Date().toISOString(),
      origem: 'BASE_LOCAL',
    };

    if (o.municipio.codigoIbge !== base.municipioIbge) {
      return { ...vazia, estado: 'LOCALIDADE_NAO_CONFIRMADA' };
    }
    const entrada = o.categoria.icone ? categorias[o.categoria.icone] : undefined;
    if (!entrada) return vazia;

    return {
      ...vazia,
      estado: 'DISPONIVEL',
      orgaoResponsavel: entrada.orgaoResponsavel,
      servico: entrada.servico,
      canais: entrada.canais,
      passos: entrada.passos,
      cuidados: entrada.cuidados,
      fontes: [...(fontesExtras[o.categoria.icone ?? ''] ?? []), base.fontePadrao],
    };
  }
}
