import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}

/** Painel inferior com fundo escurecido (rgba(28,35,33,0.55)) e alça. */
export function BottomSheet({ visible, onClose, children, accessibilityLabel }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(28,35,33,0.55)',
          }}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={{
            backgroundColor: colors.superficie,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingHorizontal: 24,
            paddingBottom: 32 + insets.bottom,
            maxHeight: '85%',
            width: '100%',
            maxWidth: 560,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.linha,
              marginBottom: 16,
            }}
          />
          <ScrollView bounces={false} contentContainerStyle={{ gap: 16 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
