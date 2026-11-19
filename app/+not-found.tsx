import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components';
import { colors } from '@/theme';

/** Rota desconhecida (404). */
export default function NaoEncontrada() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <ErrorState
          title="Página não encontrada"
          message="O endereço pode estar errado ou o registro foi excluído por quem registrou."
          action={{
            label: 'Voltar ao mapa',
            variant: 'outline',
            onPress: () => router.replace('/'),
          }}
        />
      </View>
    </SafeAreaView>
  );
}
