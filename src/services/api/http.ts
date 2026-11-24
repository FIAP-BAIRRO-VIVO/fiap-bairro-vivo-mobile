import * as Crypto from 'expo-crypto';

import { API_DOTNET_URL, API_TIMEOUT_MS } from '@/config/env';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { Sessao } from '@/models';
import { carregarSessao, salvarSessao, sessaoExpirada } from '@/storage/sessionStore';

import { erroDaApi } from './mapeadores';

interface Opcoes {
  body?: unknown;
  /** 'obrigatoria': exige sessão; 'opcional': manda o token se houver; 'nenhuma': nunca manda. */
  auth?: 'obrigatoria' | 'opcional' | 'nenhuma';
  /** Envia Idempotency-Key (POST/PUT): evita registro duplicado em reenvio. */
  idempotente?: boolean;
  query?: Record<string, string | number | undefined | null>;
}

function montarUrl(caminho: string, query?: Opcoes['query']): string {
  const qs = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_DOTNET_URL}${caminho}${qs ? `?${qs}` : ''}`;
}

/**
 * Cache curto de leituras. A API limita 60 requisições por minuto por IP, e telas como
 * o Detalhe pedem a mesma ocorrência e a mesma lista mais de uma vez. GETs iguais
 * (mesma URL e mesmo token) são reaproveitados por alguns segundos; categorias e
 * municípios mudam pouco e ficam 1 minuto. Qualquer escrita limpa o cache.
 */
const TTL_PADRAO_MS = 4_000;
const TTL_CATALOGO_MS = 60_000;
const CATALOGO = /^\/api\/(categorias|municipios)\/?$/;
const cache = new Map<string, { ate: number; promessa: Promise<unknown> }>();

export function limparCacheApi(): void {
  cache.clear();
}

/**
 * Cliente HTTP da API .NET: injeta o Bearer, aplica timeout e converte qualquer
 * falha no formato { status, mensagem } usado pelas telas.
 */
export async function apiDotnet<T>(
  metodo: string,
  caminho: string,
  opcoes: Opcoes = {},
): Promise<T> {
  if (metodo !== 'GET') {
    cache.clear();
    return requisitar<T>(metodo, caminho, opcoes);
  }
  const sessao = opcoes.auth === 'nenhuma' ? null : await carregarSessao();
  const chave = `${sessao?.token ?? ''}|${montarUrl(caminho, opcoes.query)}`;
  const agora = Date.now();
  const guardado = cache.get(chave);
  if (guardado && guardado.ate > agora) return guardado.promessa as Promise<T>;
  const promessa = requisitar<T>(metodo, caminho, opcoes);
  cache.set(chave, {
    ate: agora + (CATALOGO.test(caminho) ? TTL_CATALOGO_MS : TTL_PADRAO_MS),
    promessa,
  });
  promessa.catch(() => cache.delete(chave));
  return promessa;
}

async function requisitar<T>(metodo: string, caminho: string, opcoes: Opcoes): Promise<T> {
  const { body, auth = 'opcional', idempotente = false, query } = opcoes;
  const headers: Record<string, string> = { Accept: 'application/json' };
  let emissor: Sessao['emissor'];

  if (auth !== 'nenhuma') {
    const sessao = await carregarSessao();
    emissor = sessao?.emissor;
    if (sessao && sessaoExpirada(sessao)) {
      await salvarSessao(null);
      if (auth === 'obrigatoria') throw new ServiceError(401, MENSAGENS.sessaoExpirada);
    } else if (sessao?.token) {
      headers.Authorization = `${sessao.tipo} ${sessao.token}`;
    } else if (auth === 'obrigatoria') {
      throw new ServiceError(401, MENSAGENS.naoAutenticado);
    }
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotente) headers['Idempotency-Key'] = Crypto.randomUUID();

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), API_TIMEOUT_MS);
  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, query), {
      method: metodo,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controle.signal,
    });
  } catch {
    throw new ServiceError(
      500,
      'Não conseguimos conectar ao servidor. Verifique a internet e tente de novo.',
    );
  } finally {
    clearTimeout(timer);
  }

  const texto = await resposta.text();
  let json: unknown = null;
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }
  }

  if (!resposta.ok) {
    const erro = erroDaApi(resposta.status, json);
    // A .NET ainda não aceita o JWT da API Java no Azure (chave diferente). Um 401 aqui não
    // significa que o login Java expirou, então a sessão Java continua.
    if (erro.status === 401 && headers.Authorization && emissor === 'JAVA') {
      throw new ServiceError(401, 'Esta função ainda não aceita contas criadas pela API Java.');
    }
    // Token recusado: limpa a sessão para o app pedir login de novo.
    if (erro.status === 401 && headers.Authorization) {
      await salvarSessao(null);
      throw new ServiceError(401, MENSAGENS.sessaoExpirada);
    }
    throw new ServiceError(erro.status, erro.mensagem, erro.campos);
  }
  return json as T;
}
