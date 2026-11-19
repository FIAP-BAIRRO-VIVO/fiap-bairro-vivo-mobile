import { Platform } from 'react-native';

import { API_JAVA_PROXY_WEB, API_JAVA_URL, API_TIMEOUT_MS } from '@/config/env';
import { ServiceError } from '@/domain/erros';
import { carregarSessao } from '@/storage/sessionStore';

import { erroDaJava } from './mapeadoresJava';

interface Opcoes {
  body?: unknown;
  /** Token a usar; se omitido, usa o da sessão quando ela foi emitida pelo Java. */
  token?: string | null;
  query?: Record<string, string | number | undefined | null>;
}

/** No navegador passa pelo proxy (CORS); no celular chama a API Java direto. */
export function baseJava(): string {
  return Platform.OS === 'web' ? API_JAVA_PROXY_WEB : API_JAVA_URL;
}

/**
 * Cliente HTTP da API Java (prefixo /api/v1). Converte o erro padrão da Java
 * ({ codigo, mensagem, detalhes }) no formato { status, mensagem, campos } do app.
 */
export async function apiJava<T>(metodo: string, caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let token = opcoes.token;
  if (token === undefined) {
    const sessao = await carregarSessao();
    token = sessao?.emissor === 'JAVA' ? sessao.token : null;
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opcoes.body !== undefined) headers['Content-Type'] = 'application/json';

  const qs = Object.entries(opcoes.query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), API_TIMEOUT_MS);
  let resposta: Response;
  try {
    resposta = await fetch(`${baseJava()}/api/v1${caminho}${qs ? `?${qs}` : ''}`, {
      method: metodo,
      headers,
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
      signal: controle.signal,
    });
  } catch {
    throw new ServiceError(500, 'Não conseguimos conectar à API Java.');
  } finally {
    clearTimeout(timer);
  }

  const texto = await resposta.text();
  let json: unknown = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }
  if (!resposta.ok) {
    const erro = erroDaJava(resposta.status, json);
    throw Object.assign(new ServiceError(erro.status, erro.mensagem, erro.campos), {
      codigo: erro.codigo,
    });
  }
  return json as T;
}
