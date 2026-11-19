import { MapPinOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import type { ErroServico } from '@/models';
import { colors, fonts, type } from '@/theme';

import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

/** Lista vazia: ícone, título e convite para agir. */
export function EmptyState({ title, message, icon, action, style }: EmptyStateProps) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 36,
          paddingHorizontal: 20,
          backgroundColor: colors.superficie,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.linha,
        },
        style,
      ]}
    >
      {icon ?? <MapPinOff size={36} color={colors.concreto} strokeWidth={1.6} />}
      <Text style={[type.h3, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[type.small, { textAlign: 'center' }]}>{message}</Text> : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="outline"
          height={48}
          style={{ marginTop: 8 }}
        />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'outline' };
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Erro amigável: frase de vizinho, nunca o código HTTP. */
export function ErrorState({ title, message, action, icon, style }: ErrorStateProps) {
  return (
    <View
      style={[
        {
          gap: 12,
          padding: 18,
          backgroundColor: colors.superficie,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.linha,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        {icon ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.areia,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={type.h3}>{title}</Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              lineHeight: 20,
              color: colors.concreto,
            }}
          >
            {message}
          </Text>
        </View>
      </View>
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'primary'}
          height={48}
          radius={12}
        />
      ) : null}
    </View>
  );
}

/** Faixa de aviso (409 em asfalto, 429 em laranja claro, nota neutra em areia). */
export function Notice({
  children,
  tone = 'neutro',
  icon,
  style,
}: {
  children: ReactNode;
  tone?: 'neutro' | 'escuro' | 'alerta';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    tone === 'escuro' ? colors.asfalto : tone === 'alerta' ? colors.sinalClaro : colors.areia;
  const fg =
    tone === 'escuro' ? colors.calcada : tone === 'alerta' ? colors.sinalEscuro : colors.asfalto;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: fg }}>
        {children}
      </Text>
    </View>
  );
}

/** Esqueleto de carregamento no lugar dos cartões da lista. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  const widths = [
    ['40%', '85%'],
    ['30%', '70%'],
    ['45%', '78%'],
  ] as const;
  return (
    <View accessibilityLabel="Carregando" accessibilityRole="progressbar" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => {
        const [a, b] = widths[i % widths.length];
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 14,
              backgroundColor: colors.superficie,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.linha,
            }}
          >
            <View
              style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.areia }}
            />
            <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
              <View
                style={{ height: 12, width: a, borderRadius: 6, backgroundColor: colors.areia }}
              />
              <View
                style={{ height: 14, width: b, borderRadius: 6, backgroundColor: colors.linha }}
              />
              <View
                style={{ height: 10, width: '50%', borderRadius: 6, backgroundColor: colors.areia }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Título de erro de acordo com o status (a mensagem vem do serviço). */
export function tituloDoErro(erro: Pick<ErroServico, 'status'> | null | undefined): string {
  switch (erro?.status) {
    case 401:
      return 'Sua sessão expirou';
    case 403:
      return 'Sem permissão';
    case 404:
      return 'Registro indisponível';
    case 429:
      return 'Muitas tentativas';
    default:
      return 'Não conseguimos conectar';
  }
}
