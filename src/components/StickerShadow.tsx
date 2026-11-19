import type { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { colors } from '@/theme';

interface StickerShadowProps {
  children: ReactNode;
  /** Deslocamento da sombra chapada em px (3 para botões, 4 para cartões). */
  offset?: number;
  /** Raio do canto, igual ao do conteúdo. */
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Sombra chapada de adesivo: uma View escura deslocada atrás do conteúdo.
 * Não depende de boxShadow, então fica igual no web, Android e iOS.
 */
export function StickerShadow({
  children,
  offset = 3,
  radius = 14,
  color = colors.asfalto,
  style,
}: StickerShadowProps) {
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: color,
          pointerEvents: 'none',
        }}
      />
      {children}
    </View>
  );
}
