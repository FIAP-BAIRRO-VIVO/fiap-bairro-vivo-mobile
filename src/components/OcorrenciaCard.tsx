import { Pressable, Text, View } from 'react-native';

import type { Ocorrencia } from '@/models';
import { colors, fonts } from '@/theme';
import { linhaExplorar } from '@/utils/format';

import { CategoryIcon } from './CategoryIcon';
import { PhotoBox } from './Misc';
import { StatusChip } from './StatusChip';

/** Foto principal ou espaço reservado com o ícone da categoria. */
export function Miniatura({
  o,
  size,
  radius = 12,
}: {
  o: Ocorrencia;
  size: number;
  radius?: number;
}) {
  const foto = o.midias.find((m) => m.principal) ?? o.midias[0];
  return (
    <PhotoBox
      uri={foto?.urlExibicao}
      size={size}
      radius={radius}
      icon={<CategoryIcon icone={o.categoria.icone} color={colors.concreto} size={24} />}
    />
  );
}

/** Cartão da lista Explorar. */
export function OcorrenciaCard({ o, onPress }: { o: Ocorrencia; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${o.titulo}. ${o.status === 'ABERTA' ? 'Aberta' : 'Resolvida'}. ${o.categoria.nome}`}
      style={({ pressed }) => ({
        backgroundColor: colors.superficie,
        borderWidth: 1,
        borderColor: pressed ? colors.concreto : colors.linha,
        borderRadius: 18,
        padding: 14,
        flexDirection: 'row',
        gap: 12,
      })}
    >
      <Miniatura o={o} size={72} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusChip status={o.status} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
            {o.categoria.nome}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ fontFamily: fonts.titulo, fontSize: 16, lineHeight: 19, color: colors.asfalto }}
        >
          {o.titulo}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}
        >
          {linhaExplorar(o)}
        </Text>
      </View>
    </Pressable>
  );
}
