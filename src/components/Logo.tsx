import { Text, TextStyle } from 'react-native';
import Svg, { Ellipse, G, Path, Rect, Circle } from 'react-native-svg';

import { colors, fonts } from '@/theme';

interface LogoProps {
  size?: number;
  /** Sombra suave sob o pino (versão completa do símbolo). */
  pinShadow?: boolean;
  accessibilityLabel?: string;
}

/**
 * Símbolo do Bairro Vivo (assets-marca/logo-simbolo.svg): adesivo inclinado com
 * três quadras verdes e um pino laranja no lugar da quarta.
 */
export function Logo({
  size = 48,
  pinShadow = false,
  accessibilityLabel = 'Símbolo do Bairro Vivo',
}: LogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-2 -2 52 52"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <G transform="rotate(-6 24 24)">
        <Rect x={5} y={5} width={42} height={42} rx={11} fill={colors.asfalto} />
        <Rect
          x={2}
          y={2}
          width={42}
          height={42}
          rx={11}
          fill={colors.superficie}
          stroke={colors.asfalto}
          strokeWidth={2}
        />
        <G transform="translate(6.5 6.3) scale(0.7)">
          <Rect x={4} y={4} width={19} height={21} rx={6} fill={colors.verde} />
          <Rect x={27} y={4} width={17} height={14} rx={4} fill={colors.verde} />
          <Rect x={4} y={29} width={19} height={15} rx={3.5} fill={colors.verde} />
          {pinShadow ? (
            <Ellipse cx={35.5} cy={45.6} rx={4.2} ry={1.2} fill={colors.asfalto} opacity={0.18} />
          ) : null}
          <G transform="rotate(-12 35.5 45)">
            <Path d="M35.5 45s8-6.8 8-12.8a8 8 0 0 0-16 0c0 6 8 12.8 8 12.8z" fill={colors.sinal} />
            <Circle cx={35.5} cy={32.2} r={3} fill={colors.superficie} />
          </G>
        </G>
      </G>
    </Svg>
  );
}

/** Selo de "resolvido" usado na tela de comemoração. */
export function ResolvedSeal({ size = 132 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-2 -2 52 52"
      accessibilityRole="image"
      accessibilityLabel="Selo de resolvido"
    >
      <G transform="rotate(-6 24 24)">
        <Rect x={5} y={5} width={42} height={42} rx={11} fill={colors.verdeEscuro} />
        <Rect
          x={2}
          y={2}
          width={42}
          height={42}
          rx={11}
          fill={colors.superficie}
          stroke={colors.asfalto}
          strokeWidth={2}
        />
        <Path
          d="M13 23.5l7 7 13-14"
          stroke={colors.verde}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

interface WordmarkProps {
  size?: number;
  color?: string;
  dotColor?: string;
  style?: TextStyle;
}

/** "bairro vivo." com o ponto final laranja. */
export function Wordmark({
  size = 34,
  color = colors.asfalto,
  dotColor = colors.sinal,
  style,
}: WordmarkProps) {
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: fonts.tituloForte,
          fontSize: size,
          letterSpacing: size * -0.02,
          color,
        },
        style,
      ]}
    >
      bairro vivo<Text style={{ color: dotColor }}>.</Text>
    </Text>
  );
}
