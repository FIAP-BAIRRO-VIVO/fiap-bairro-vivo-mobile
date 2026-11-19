import { Trash2 } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

/** Confirmação de exclusão em bottom sheet (ExcluirConfirmacao.dc.html). */
export function ExcluirSheet({
  visible,
  titulo,
  excluindo,
  onConfirmar,
  onCancelar,
}: {
  visible: boolean;
  titulo: string;
  excluindo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancelar}
      accessibilityLabel="Excluir esta ocorrência?"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.sinalClaro,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trash2 size={26} color={colors.sinalEscuro} strokeWidth={2} />
      </View>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: fonts.tituloForte,
          fontSize: 24,
          letterSpacing: -0.24,
          color: colors.asfalto,
        }}
      >
        Excluir esta ocorrência?
      </Text>
      <Text
        style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.asfalto }}
      >
        “{titulo}” vai sair do mapa e das listas.
      </Text>
      <View
        style={{
          backgroundColor: colors.calcada,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            color: colors.concreto,
          }}
        >
          Os comentários e votos dos vizinhos ficam guardados no histórico, mesmo depois de excluir.
        </Text>
      </View>
      <Button
        title="Sim, excluir"
        variant="danger"
        height={56}
        radius={16}
        fontSize={16}
        loading={excluindo}
        onPress={onConfirmar}
      />
      <Button title="Cancelar" variant="outline" radius={16} fontSize={16} onPress={onCancelar} />
    </BottomSheet>
  );
}
