import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { tabOptions, tabScreenOptions } from '@/components/AppTabBar';
import { useSession } from '@/hooks/useSession';
import { colors } from '@/theme';

/** Abas do CIDADÃO (e do visitante, que só lê). */
export default function TabsLayout() {
  const { sessao, carregando, visitante } = useSession();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.verde} />
      </View>
    );
  }
  if (sessao?.perfil === 'ADMIN') return <Redirect href="/relatorios" />;
  if (!sessao && !visitante) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={tabOptions('Mapa', 'mapa')} />
      <Tabs.Screen name="explorar" options={tabOptions('Explorar', 'explorar')} />
      <Tabs.Screen name="minhas" options={tabOptions('Minhas', 'minhas')} />
      <Tabs.Screen name="perfil" options={tabOptions('Perfil', 'perfil')} />
    </Tabs>
  );
}
