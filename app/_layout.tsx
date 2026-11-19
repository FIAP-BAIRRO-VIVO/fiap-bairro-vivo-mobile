import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorState, ToastProvider } from '@/components';
import { SessionProvider } from '@/hooks/useSession';
import { dadosService } from '@/services';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Falha inesperada em qualquer tela: mensagem de vizinho e botão para tentar de novo. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.calcada, padding: 20, justifyContent: 'center' }}
    >
      <ErrorState
        title="Algo deu errado por aqui"
        message="Não foi culpa sua. Tente de novo; se continuar, feche e abra o app."
        action={{ label: 'Tentar de novo', onPress: retry }}
      />
    </View>
  );
}

/** No navegador, o app ocupa uma coluna com largura de celular. */
function MolduraWeb({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.mapaFundo }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          backgroundColor: colors.calcada,
          overflow: 'hidden',
          boxShadow: '0px 0px 24px rgba(28,35,33,0.12)',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [dadosProntos, setDadosProntos] = useState(false);

  useEffect(() => {
    // Seed inicial na primeira abertura (dados de exemplo).
    dadosService
      .garantirDadosIniciais()
      .catch(() => undefined)
      .finally(() => setDadosProntos(true));
  }, []);

  const pronto = (fontsLoaded || !!fontError) && dadosProntos;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => undefined);
  }, [pronto]);

  if (!pronto) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <MolduraWeb>
          <ToastProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.calcada },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)/cadastro" />
            </Stack>
          </ToastProvider>
        </MolduraWeb>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
