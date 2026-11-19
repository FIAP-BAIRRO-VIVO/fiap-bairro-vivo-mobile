import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/Toast';
import { MENSAGENS } from '@/services';

import { useSession } from './useSession';

/** Destino padrão depois do login, conforme o perfil. */
export function rotaInicial(perfil: 'CIDADAO' | 'ADMIN' | undefined): string {
  return perfil === 'ADMIN' ? '/relatorios' : '/';
}

/** Aceita só caminhos internos do app como destino de volta. */
export function destinoSeguro(voltar: unknown): string | null {
  if (typeof voltar !== 'string' || !voltar.startsWith('/') || voltar.startsWith('//')) return null;
  return voltar;
}

/**
 * Para ações que pedem conta (Registrar, Votar, Comentar): se não houver sessão,
 * guarda a intenção no parâmetro `voltar` e abre o login.
 * Retorna true quando a ação pode seguir.
 */
export function useExigirLogin() {
  const { sessao } = useSession();
  const router = useRouter();
  const toast = useToast();

  return useCallback(
    (destino: string): boolean => {
      if (sessao?.perfil === 'CIDADAO') return true;
      if (sessao?.perfil === 'ADMIN') {
        toast.show(MENSAGENS.adminSoLeitura, 'info');
        return false;
      }
      toast.show(MENSAGENS.naoAutenticado, 'info');
      router.push({ pathname: '/login', params: { voltar: destino } });
      return false;
    },
    [sessao, router, toast],
  );
}
