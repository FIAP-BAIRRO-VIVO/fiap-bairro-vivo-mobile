import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, gradients, radius as r, sizes, sticker } from '@/theme';

import { GradientView } from './GradientView';
import { StickerShadow } from './StickerShadow';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'outlineSinal'
  | 'danger'
  | 'ghost'
  | 'register'
  | 'light'
  | 'lightOutline';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  radius?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

interface Look {
  bg: string;
  fg: string;
  border?: string;
  borderWidth?: number;
  sticker: boolean;
  bold?: boolean;
}

const looks: Record<ButtonVariant, Look> = {
  primary: { bg: colors.verde, fg: colors.superficie, sticker: true },
  register: { bg: colors.sinal, fg: colors.superficie, sticker: true, bold: true },
  outline: {
    bg: colors.superficie,
    fg: colors.asfalto,
    border: colors.asfalto,
    borderWidth: 1.5,
    sticker: false,
  },
  outlineSinal: {
    bg: colors.superficie,
    fg: colors.sinalEscuro,
    border: colors.sinal,
    borderWidth: 1.5,
    sticker: false,
  },
  danger: { bg: colors.sinalEscuro, fg: colors.superficie, sticker: false },
  ghost: { bg: 'transparent', fg: colors.verde, sticker: false },
  light: { bg: colors.calcada, fg: colors.verde, sticker: false, bold: true },
  lightOutline: {
    bg: 'transparent',
    fg: colors.calcada,
    border: colors.calcada,
    borderWidth: 1.5,
    sticker: false,
  },
};

/** Botão da marca: 52 px, cantos de 14 px e sombra chapada nos principais. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  height = sizes.botao,
  radius = r.botao,
  fontSize = 15,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const look = looks[variant];
  const inactive = disabled || loading;
  const withSticker = look.sticker && !disabled;

  const renderBody = (pressed: boolean) => {
    const shift = withSticker && pressed && !inactive ? 2 : 0;
    const box: ViewStyle = {
      height,
      borderRadius: radius,
      backgroundColor: variant === 'register' ? undefined : look.bg,
      borderColor: look.border,
      borderWidth: look.borderWidth ?? 0,
      paddingHorizontal: variant === 'ghost' ? 8 : 20,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ translateX: shift }, { translateY: shift }],
      opacity: disabled ? 0.5 : 1,
    };
    const inner = (
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={look.fg} /> : icon}
        <Text
          style={{
            color: look.fg,
            fontFamily: look.bold ? fonts.negrito : fonts.semi,
            fontSize,
          }}
        >
          {title}
        </Text>
      </View>
    );
    if (variant === 'register') {
      return (
        <GradientView gradient={gradients.sinal} style={box}>
          {inner}
        </GradientView>
      );
    }
    return <View style={box}>{inner}</View>;
  };

  const pressable = (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
    >
      {({ pressed }) => renderBody(pressed)}
    </Pressable>
  );

  if (withSticker) {
    return (
      <StickerShadow offset={sticker.botao} radius={radius} style={style}>
        {pressable}
      </StickerShadow>
    );
  }
  return <View style={style}>{pressable}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
