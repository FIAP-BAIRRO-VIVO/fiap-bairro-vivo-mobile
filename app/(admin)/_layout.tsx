import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { tabOptions, tabScreenOptions } from '@/components/AppTabBar';
import { useSession } from '@/hooks/useSession';
import { colors } from '@/theme';

/** Abas do ADMIN: só Relatórios, Categorias e o próprio perfil. */
export default function AdminLayout() {
  const { sessao, carregando } = useSession();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.verde} />
      </View>
    );
  }
  if (!sessao) return <Redirect href="/login" />;
  if (sessao.perfil !== 'ADMIN') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="relatorios" options={tabOptions('Relatórios', 'relatorios')} />
      <Tabs.Screen name="categorias" options={tabOptions('Categorias', 'categorias')} />
      <Tabs.Screen name="conta" options={tabOptions('Perfil', 'perfil')} />
    </Tabs>
  );
}
