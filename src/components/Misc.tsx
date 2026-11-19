import { Camera, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, gradients } from '@/theme';

import { GradientView } from './GradientView';

/** Barra "1 de 2 confirmações" (verde para resolver, laranja para reabrir). */
export function VoteProgress({
  count,
  target,
  label,
  hint,
  barHeight = 8,
}: {
  count: number;
  target: 'resolver' | 'reabrir';
  label?: string;
  hint?: string;
  barHeight?: number;
}) {
  const fill = target === 'resolver' ? colors.verde : colors.sinal;
  const falta = Math.max(0, 2 - count);
  return (
    <View style={{ gap: 8 }} accessibilityLabel={`${count} de 2 confirmações para ${target}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text
          style={{ fontFamily: fonts.negrito, fontSize: 14, color: colors.asfalto, flexShrink: 1 }}
        >
          {label ?? `${count} de 2 confirmações para ${target}`}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.concreto }}>
          {hint ?? (falta > 0 ? `falta ${falta}` : 'completo')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: barHeight,
              borderRadius: 999,
              backgroundColor: i < count ? fill : colors.linha,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Foto da ocorrência ou espaço reservado com degradê concreto. */
export function PhotoBox({
  uri,
  size,
  width,
  height,
  radius = 12,
  iconSize = 24,
  caption,
  icon,
  style,
  children,
}: {
  uri?: string;
  size?: number;
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  iconSize?: number;
  caption?: string;
  /** Ícone no lugar da câmera quando não há foto. */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const w = width ?? size;
  const h = height ?? size;
  // URL quebrada (ex.: mídia de exemplo inexistente) cai no espaço reservado.
  const [falhou, setFalhou] = useState<string | null>(null);
  if (uri && falhou !== uri) {
    return (
      <View style={[{ width: w, height: h, borderRadius: radius, overflow: 'hidden' }, style]}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          accessibilityLabel="Foto da ocorrência"
          onError={() => setFalhou(uri)}
        />
        {children}
      </View>
    );
  }
  return (
    <GradientView
      gradient={gradients.concreto}
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      {/* View posicionada: no web, um <svg> solto ficaria atrás da camada do degradê. */}
      <View>{icon ?? <Camera size={iconSize} color={colors.concreto} strokeWidth={1.7} />}</View>
      {caption ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
          {caption}
        </Text>
      ) : null}
      {children}
    </GradientView>
  );
}

/** Caixa de seleção de 22 px com rótulo e descrição opcionais. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  boxed = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  boxed?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: description ? 'flex-start' : 'center',
        minHeight: 44,
        ...(boxed
          ? {
              backgroundColor: colors.superficie,
              borderWidth: 1,
              borderColor: colors.linha,
              borderRadius: 16,
              padding: 14,
            }
          : null),
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          marginTop: description ? 1 : 0,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: checked ? colors.verde : colors.concreto,
          backgroundColor: checked ? colors.verde : colors.superficie,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Check size={15} color={colors.superficie} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.asfalto }}>{label}</Text>
        {description ? (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 19,
              color: colors.concreto,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Rótulo de seção em caixa alta ("QUEM RESOLVE", "FONTES"...). */
export function Overline({
  children,
  color = colors.concreto,
}: {
  children: string;
  color?: string;
}) {
  return (
    <Text style={{ fontFamily: fonts.negrito, fontSize: 12, letterSpacing: 0.72, color }}>
      {children}
    </Text>
  );
}

/** Selo escuro "ADMIN" / "ADMIN · SÓ LEITURA". */
export function DarkBadge({ children }: { children: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.asfalto,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.negrito,
          fontSize: 11,
          letterSpacing: 0.66,
          color: colors.calcada,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
