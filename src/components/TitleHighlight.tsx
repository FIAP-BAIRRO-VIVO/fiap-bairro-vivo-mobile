import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, type } from '@/theme';

interface TitleHighlightProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Título com marca-texto: faixa #FDBA74 cobrindo a metade de baixo do texto
 * (de 60% a 88% da altura, como no mockup).
 */
export function TitleHighlight({ children, style, textStyle }: TitleHighlightProps) {
  return (
    <View style={[{ alignSelf: 'flex-start', marginLeft: -4, paddingHorizontal: 4 }, style]}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '60%',
          bottom: '12%',
          backgroundColor: colors.sinalSuave,
          pointerEvents: 'none',
        }}
      />
      <Text accessibilityRole="header" style={[type.h1, textStyle]}>
        {children}
      </Text>
    </View>
  );
}
