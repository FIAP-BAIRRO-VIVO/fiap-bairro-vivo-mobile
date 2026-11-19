import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors, sizes, type } from '@/theme';

interface AppBarProps {
  title?: string;
  /** Ícone à esquerda: voltar (seta) ou fechar (X). */
  kind?: 'back' | 'close';
  onBack: () => void;
  backLabel?: string;
  /** Sem fundo branco nem borda (usado no Cadastro). */
  bare?: boolean;
  right?: ReactNode;
}

/** Barra superior de 64 px das telas internas. */
export function AppBar({
  title,
  kind = 'back',
  onBack,
  backLabel,
  bare = false,
  right,
}: AppBarProps) {
  const Icon = kind === 'close' ? X : ChevronLeft;
  return (
    <View
      style={{
        height: sizes.appBar,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: bare ? 'transparent' : colors.superficie,
        borderBottomWidth: bare ? 0 : 1,
        borderBottomColor: colors.linha,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel ?? (kind === 'close' ? 'Fechar' : 'Voltar')}
        hitSlop={4}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon size={kind === 'close' ? 22 : 22} color={colors.asfalto} strokeWidth={2} />
      </Pressable>
      {title ? (
        <Text accessibilityRole="header" style={[type.appBar, { flex: 1 }]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}
