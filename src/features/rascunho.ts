import type { FormValores } from './OcorrenciaForm';

/**
 * Rascunho da nova ocorrência, guardado em memória enquanto o app está aberto.
 * Se a sessão expirar no meio do formulário, o texto volta depois do login.
 */
let rascunho: FormValores | null = null;

export function lerRascunho(): FormValores | null {
  return rascunho;
}

export function salvarRascunho(v: FormValores): void {
  rascunho = v;
}

export function limparRascunho(): void {
  rascunho = null;
}
