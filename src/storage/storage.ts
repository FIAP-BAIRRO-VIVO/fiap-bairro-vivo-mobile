import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Único ponto do app que fala com o AsyncStorage. Telas nunca importam este módulo:
 * elas usam `src/services`.
 */
export const KEYS = {
  usuarios: 'bv:usuarios',
  categorias: 'bv:categorias',
  municipios: 'bv:municipios',
  ocorrencias: 'bv:ocorrencias',
  atualizacoes: 'bv:atualizacoes',
  historico: 'bv:historico',
  sessao: 'bv:sessao',
  intencao: 'bv:intencao',
  seedVersao: 'bv:seed-versao',
  registroApi: 'bv:registro-api',
  categoriasDesativadasApi: 'bv:categorias-desativadas-api',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

export async function lerJSON<T>(key: StorageKey, padrao: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return padrao;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return padrao;
  }
}

export async function gravarJSON<T>(key: StorageKey, valor: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(valor));
}

/** Grava várias chaves numa única operação de escrita. */
export async function gravarVarios(pares: [StorageKey, unknown][]): Promise<void> {
  await AsyncStorage.multiSet(pares.map(([k, v]) => [k, JSON.stringify(v)]));
}

export async function remover(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function removerTudo(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
