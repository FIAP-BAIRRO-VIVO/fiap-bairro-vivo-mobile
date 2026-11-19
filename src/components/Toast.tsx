import { Check, Info, TriangleAlert } from 'lucide-react-native';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

type ToastKind = 'sucesso' | 'info' | 'aviso';

interface ToastState {
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

const looks: Record<ToastKind, { bg: string; fg: string }> = {
  sucesso: { bg: colors.verde, fg: colors.superficie },
  info: { bg: colors.asfalto, fg: colors.calcada },
  aviso: { bg: colors.sinalClaro, fg: colors.sinalEscuro },
};

/** Aviso flutuante (sucesso em verde, 409 em asfalto, 429 em laranja claro). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: ToastKind = 'sucesso') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const look = toast ? looks[toast.kind] : looks.sucesso;
  const Icon = toast?.kind === 'sucesso' ? Check : toast?.kind === 'aviso' ? TriangleAlert : Info;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 16,
            right: 16,
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <View
            style={{
              maxWidth: 520,
              width: '100%',
              backgroundColor: look.bg,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              boxShadow:
                toast.kind === 'sucesso'
                  ? '0px 6px 18px rgba(31,122,77,0.3)'
                  : '0px 6px 18px rgba(28,35,33,0.25)',
            }}
          >
            <Icon size={18} color={look.fg} strokeWidth={2.6} />
            <Text style={{ flex: 1, fontFamily: fonts.semi, fontSize: 14, color: look.fg }}>
              {toast.message}
            </Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
