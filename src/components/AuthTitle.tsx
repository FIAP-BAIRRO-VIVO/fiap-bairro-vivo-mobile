import { Text, View } from 'react-native';

import { colors, fonts, type } from '@/theme';

/** Título das telas de Login e Cadastro: traço laranja, título e apoio. */
export function AuthTitle({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          width: 32,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.sinal,
          marginBottom: 6,
        }}
      />
      <Text accessibilityRole="header" style={type.display}>
        {titulo}
      </Text>
      <Text
        style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.concreto }}
      >
        {texto}
      </Text>
    </View>
  );
}
