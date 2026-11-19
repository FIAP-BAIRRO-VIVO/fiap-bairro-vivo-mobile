import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { angleToPoints, brilhoLaranja, GradientSpec } from '@/theme';

interface Glow {
  /** Posição do centro, em fração da largura/altura. */
  x: number;
  y: number;
  /** Raio em fração da distância até o canto mais distante (como no CSS). */
  reach: number;
  opacity?: number;
}

interface GradientViewProps {
  gradient: GradientSpec;
  /** Brilho laranja (degradê verde profundo). */
  glow?: Glow;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function GradientView({ gradient, glow, style, children }: GradientViewProps) {
  const { start, end } = angleToPoints(gradient.angle);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  let glowLayer: ReactNode = null;
  if (glow && size.w > 0) {
    const cx = glow.x * size.w;
    const cy = glow.y * size.h;
    const far = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(size.w - cx, cy),
      Math.hypot(cx, size.h - cy),
      Math.hypot(size.w - cx, size.h - cy),
    );
    const radius = far * glow.reach;
    glowLayer = (
      <Svg
        width={size.w}
        height={size.h}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      >
        <Defs>
          <RadialGradient id="brilho" cx={cx} cy={cy} r={radius} gradientUnits="userSpaceOnUse">
            <Stop
              offset="0"
              stopColor={brilhoLaranja.color}
              stopOpacity={glow.opacity ?? brilhoLaranja.opacity}
            />
            <Stop offset="1" stopColor={brilhoLaranja.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={radius} fill="url(#brilho)" />
      </Svg>
    );
  }

  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={glow ? onLayout : undefined}>
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />
      {glowLayer}
      {children}
    </View>
  );
}
