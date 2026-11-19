import type { Sessao } from '@/models';

import { gravarJSON, KEYS, lerJSON, remover } from './storage';

/**
 * Guarda a sessão atual em memória e no armazenamento local.
 * STANDBY: com a API Java, o JWT deve ir para o Expo SecureStore no celular.
 */
let atual: Sessao | null = null;
let carregada = false;
const ouvintes = new Set<(s: Sessao | null) => void>();

export async function carregarSessao(): Promise<Sessao | null> {
  if (!carregada) {
    atual = await lerJSON<Sessao | null>(KEYS.sessao, null);
    carregada = true;
  }
  return atual;
}

export function sessaoAtual(): Sessao | null {
  return atual;
}

export function sessaoExpirada(s: Sessao | null): boolean {
  return !!s && new Date(s.expiraEm).getTime() <= Date.now();
}

export async function salvarSessao(s: Sessao | null): Promise<void> {
  atual = s;
  carregada = true;
  if (s) await gravarJSON(KEYS.sessao, s);
  else await remover(KEYS.sessao);
  ouvintes.forEach((fn) => fn(s));
}

export function ouvirSessao(fn: (s: Sessao | null) => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
