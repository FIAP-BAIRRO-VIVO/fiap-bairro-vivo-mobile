import { gravarJSON, KEYS, lerJSON } from './storage';

/**
 * O que esta conta fez na API, guardado no aparelho.
 * A API .NET não informa o autor das atualizações nem se a conta já votou no ciclo
 * (STANDBY), então o app lembra disso localmente para desativar o voto repetido
 * e montar os contadores do perfil.
 */
export interface RegistroAtualizacao {
  idUsuario: string;
  idOcorrencia: string;
  idAtualizacao: string;
  tipo: string;
  numeroCiclo: number;
  voto: boolean;
  dtCriacao: string;
}

export async function lerRegistro(idUsuario: string): Promise<RegistroAtualizacao[]> {
  const todos = await lerJSON<RegistroAtualizacao[]>(KEYS.registroApi, []);
  return todos.filter((r) => r.idUsuario === idUsuario);
}

export async function registrar(r: RegistroAtualizacao): Promise<void> {
  const todos = await lerJSON<RegistroAtualizacao[]>(KEYS.registroApi, []);
  await gravarJSON(KEYS.registroApi, [...todos, r]);
}

/** Categorias que o ADMIN desativou (a API não lista inativas). */
export async function lerCategoriasDesativadas(): Promise<string[]> {
  return lerJSON<string[]>(KEYS.categoriasDesativadasApi, []);
}

export async function marcarCategoriaDesativada(id: string): Promise<void> {
  const ids = await lerCategoriasDesativadas();
  if (!ids.includes(id)) await gravarJSON(KEYS.categoriasDesativadasApi, [...ids, id]);
}
