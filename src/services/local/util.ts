import * as Crypto from 'expo-crypto';

import { LATENCIA_LOCAL_MS } from '@/config/env';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { Sessao, Usuario, UsuarioPublico } from '@/models';
import { carregarSessao, salvarSessao, sessaoExpirada } from '@/storage/sessionStore';
import { KEYS, lerJSON } from '@/storage/storage';

/** Atraso curto para a fonte local se comportar como uma chamada de rede. */
export function simularRede(ms = LATENCIA_LOCAL_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${Crypto.randomUUID()}`;
}

export function agoraISO(): string {
  return new Date().toISOString();
}

export function publico(u: Usuario): UsuarioPublico {
  const { senhaHash: _omitido, ...resto } = u;
  return resto;
}

/** Sessão válida ou erro 401 (sessão expirada limpa o token). */
export async function exigirSessao(): Promise<{ sessao: Sessao; usuario: UsuarioPublico }> {
  const sessao = await carregarSessao();
  if (!sessao) throw new ServiceError(401, MENSAGENS.naoAutenticado);
  if (sessaoExpirada(sessao)) {
    await salvarSessao(null);
    throw new ServiceError(401, MENSAGENS.sessaoExpirada);
  }
  const usuarios = await lerJSON<Usuario[]>(KEYS.usuarios, []);
  const u = usuarios.find((x) => x.id === sessao.idUsuario && x.ativo);
  if (!u) {
    await salvarSessao(null);
    throw new ServiceError(401, MENSAGENS.sessaoExpirada);
  }
  return { sessao, usuario: publico(u) };
}

export async function exigirAdmin(): Promise<UsuarioPublico> {
  const { usuario } = await exigirSessao();
  if (usuario.perfil !== 'ADMIN') throw new ServiceError(403, 'Só o perfil ADMIN pode fazer isso.');
  return usuario;
}

/**
 * Limite simples de escritas por conta (simula o 429 da API):
 * no máximo 12 escritas por minuto.
 */
const escritas = new Map<string, number[]>();
export function limitarEscritas(idUsuario: string, max = 12, janelaMs = 60_000): void {
  const agora = Date.now();
  const lista = (escritas.get(idUsuario) ?? []).filter((t) => agora - t < janelaMs);
  if (lista.length >= max) throw new ServiceError(429, MENSAGENS.muitasTentativas);
  lista.push(agora);
  escritas.set(idUsuario, lista);
}

/** Envolve falhas inesperadas do armazenamento (ex.: cota cheia) no formato padrão. */
export async function comErroPadrao<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    const msg = e instanceof Error ? e.message : '';
    if (/quota/i.test(msg)) {
      throw new ServiceError(
        500,
        'Não deu para salvar: o armazenamento do navegador está cheio. Tente fotos menores.',
      );
    }
    throw new ServiceError(500, 'Não conseguimos salvar agora. Tente de novo.');
  }
}
