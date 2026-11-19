import { Redirect, useGlobalSearchParams, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/hooks/useSession';
import type { Perfil } from '@/models';
import { colors } from '@/theme';

/** Monta o caminho atual com a query, para voltar depois do login. */
export function useCaminhoAtual(): string {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const query = Object.entries(params)
    .filter(([k, v]) => typeof v === 'string' && !pathname.includes(String(v)) && k !== 'voltar')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Protege uma tela por perfil. Sem sessão: vai para o login guardando a intenção.
 * Perfil errado: volta para a área certa.
 */
export function Protegida({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const { sessao, carregando } = useSession();
  const caminho = useCaminhoAtual();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.verde} />
      </View>
    );
  }
  if (!sessao) return <Redirect href={{ pathname: '/login', params: { voltar: caminho } }} />;
  if (sessao.perfil !== perfil)
    return <Redirect href={sessao.perfil === 'ADMIN' ? '/relatorios' : '/'} />;
  return <>{children}</>;
}
