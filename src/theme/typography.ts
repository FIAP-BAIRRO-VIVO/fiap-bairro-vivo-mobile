import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const fonts = {
  titulo: 'BricolageGrotesque_700Bold',
  tituloForte: 'BricolageGrotesque_800ExtraBold',
  regular: 'Inter_400Regular',
  medio: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  negrito: 'Inter_700Bold',
} as const;

/** letter-spacing de -2% nos títulos. */
const tracking = (size: number, pct = -0.02) => size * pct;

export const type = {
  display: {
    fontFamily: fonts.tituloForte,
    fontSize: 30,
    letterSpacing: tracking(30),
    color: colors.asfalto,
  },
  h1: {
    fontFamily: fonts.tituloForte,
    fontSize: 28,
    letterSpacing: tracking(28),
    color: colors.asfalto,
  },
  h2: { fontFamily: fonts.titulo, fontSize: 20, color: colors.asfalto },
  h3: { fontFamily: fonts.titulo, fontSize: 17, lineHeight: 20, color: colors.asfalto },
  appBar: { fontFamily: fonts.titulo, fontSize: 19, color: colors.asfalto },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.asfalto },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.asfalto },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.concreto },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.concreto },
  label: { fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto },
  overline: {
    fontFamily: fonts.negrito,
    fontSize: 12,
    letterSpacing: 12 * 0.06,
    color: colors.concreto,
  },
  button: { fontFamily: fonts.semi, fontSize: 15 },
} satisfies Record<string, TextStyle>;

export { tracking };
