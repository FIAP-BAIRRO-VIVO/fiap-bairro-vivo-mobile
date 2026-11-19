import { Pressable, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Cor do ponto antes do texto (laranja = abertas, verde = resolvidas). */
  dot?: string;
  /** "floating": sobre o mapa, com sombra leve; "outlined": em listas, com borda. */
  look?: 'floating' | 'outlined';
}

/** Pílula de 36 px usada nos filtros Todas / Abertas / Resolvidas. */
export function FilterChip({ label, selected, onPress, dot, look = 'outlined' }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filtrar: ${label}`}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? colors.asfalto : colors.superficie,
        borderWidth: !selected && look === 'outlined' ? 1 : 0,
        borderColor: colors.linha,
        boxShadow: !selected && look === 'floating' ? '0px 1px 4px rgba(28,35,33,0.1)' : undefined,
      }}
    >
      {dot && !selected ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      ) : null}
      <Text
        style={{
          fontFamily: fonts.semi,
          fontSize: 13,
          color: selected ? colors.superficie : colors.asfalto,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
