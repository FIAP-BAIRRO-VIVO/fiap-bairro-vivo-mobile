import type { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { colors, radius, sticker } from '@/theme';

import { StickerShadow } from './StickerShadow';

interface CardProps {
  children: ReactNode;
  /** Cartão de destaque: borda de 2 px e sombra chapada de 4 px. */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Estilo do contêiner externo (margens, flex). */
  containerStyle?: StyleProp<ViewStyle>;
  radius?: number;
}

export function Card({
  children,
  highlight = false,
  style,
  containerStyle,
  radius: r = radius.cartao,
}: CardProps) {
  const body = (
    <View
      style={[
        {
          backgroundColor: colors.superficie,
          borderRadius: r,
          borderWidth: highlight ? 2 : 1,
          borderColor: highlight ? colors.asfalto : colors.linha,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!highlight) return <View style={containerStyle}>{body}</View>;
  return (
    <StickerShadow offset={sticker.cartao} radius={r} style={containerStyle}>
      {body}
    </StickerShadow>
  );
}
