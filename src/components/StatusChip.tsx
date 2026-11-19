import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '@/theme';
import type { StatusOcorrencia } from '@/models';

type ChipSize = 'sm' | 'md' | 'lg';

const dims: Record<ChipSize, { font: number; py: number; px: number; dot: number; gap: number }> = {
  sm: { font: 11, py: 3, px: 8, dot: 6, gap: 5 },
  md: { font: 12, py: 5, px: 10, dot: 7, gap: 6 },
  lg: { font: 13, py: 6, px: 12, dot: 8, gap: 8 },
};

export function CheckMark({
  size = 12,
  color = colors.verdeEscuro,
  strokeWidth = 3,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5 9-10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface StatusChipProps {
  status: StatusOcorrencia;
  size?: ChipSize;
  /** Texto extra depois do status, ex.: "ciclo 1". */
  suffix?: string;
  /** Sem ícone/ponto (usado na tela de comemoração). */
  plain?: boolean;
}

/** Chip de situação: sempre texto + ícone, nunca só cor. */
export function StatusChip({ status, size = 'sm', suffix, plain = false }: StatusChipProps) {
  const d = dims[size];
  const aberta = status === 'ABERTA';
  const label = suffix ? `${status} · ${suffix}` : status;
  return (
    <View
      accessibilityLabel={`Situação: ${aberta ? 'aberta' : 'resolvida'}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: d.gap,
        backgroundColor: aberta ? colors.sinalClaro : colors.broto,
        paddingVertical: d.py,
        paddingHorizontal: d.px,
        borderRadius: 999,
      }}
    >
      {plain ? null : aberta ? (
        <View
          style={{
            width: d.dot,
            height: d.dot,
            borderRadius: d.dot / 2,
            backgroundColor: colors.sinal,
          }}
        />
      ) : (
        <CheckMark size={d.dot + 4} />
      )}
      <Text
        style={{
          fontFamily: fonts.negrito,
          fontSize: d.font,
          letterSpacing: d.font * 0.04,
          color: aberta ? colors.sinalEscuro : colors.verdeEscuro,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
