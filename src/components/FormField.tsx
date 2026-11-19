import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/theme';

/** Remove o contorno azul padrão do navegador; a borda já mostra o foco. */
export const webNoOutline = Platform.select({ web: { outlineWidth: 0 } as object, default: {} });

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Complemento cinza do rótulo, ex.: "(opcional)". */
  labelHint?: string;
  error?: string;
  helper?: string;
  /** Mostra o contador "n / max" (usa maxLength). */
  showCounter?: boolean;
  /** Número de linhas para campos multilinha. */
  rows?: number;
  /** Campo de senha com botão de mostrar/ocultar. */
  password?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

/** Campo com rótulo visível, borda de 1,5 px e mensagem de erro embaixo do campo certo. */
export function FormField({
  label,
  labelHint,
  error,
  helper,
  showCounter,
  rows,
  password,
  style,
  height = 52,
  value,
  maxLength,
  ...inputProps
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const multiline = !!rows;
  const borderColor = error ? colors.sinal : focused ? colors.verde : colors.linha;

  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>
        {label}
        {labelHint ? (
          <Text style={{ fontFamily: fonts.regular, color: colors.concreto }}> {labelHint}</Text>
        ) : null}
      </Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={rows}
          secureTextEntry={password && !visible}
          placeholderTextColor={colors.concreto}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
          style={[
            {
              minHeight: multiline ? undefined : height,
              height: multiline ? (rows ?? 3) * 23 + 28 : height,
              paddingHorizontal: 16,
              paddingRight: password ? 52 : 16,
              paddingVertical: multiline ? 14 : 0,
              borderWidth: 1.5,
              borderColor,
              borderRadius: radius.campo,
              backgroundColor: colors.superficie,
              fontFamily: fonts.regular,
              fontSize: 15,
              lineHeight: multiline ? 23 : undefined,
              color: colors.asfalto,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            webNoOutline,
          ]}
        />
        {password ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            style={{
              position: 'absolute',
              right: 4,
              top: (height - 44) / 2,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {visible ? (
              <EyeOff size={20} color={colors.concreto} strokeWidth={1.8} />
            ) : (
              <Eye size={20} color={colors.concreto} strokeWidth={1.8} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
          {helper}
        </Text>
      ) : null}
      {showCounter && maxLength ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: colors.concreto,
            alignSelf: 'flex-end',
          }}
        >
          {(value ?? '').length} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
}
