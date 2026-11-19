import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight, Info, LogOut, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomSheet,
  Button,
  GradientView,
  Protegida,
  StickerShadow,
  useToast,
} from '@/components';
import { iniciais } from '@/domain/authRules';
import { useCarregar } from '@/hooks/useCarregar';
import { useSession } from '@/hooks/useSession';
import { atualizacaoService, authService, ocorrenciaService } from '@/services';
import { colors, fonts, gradients, type } from '@/theme';

function Contador({
  valor,
  rotulo,
  destaque,
}: {
  valor: number | string;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: destaque ? colors.sinalClaro : colors.superficie,
        borderWidth: destaque ? 0 : 1,
        borderColor: colors.linha,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 2,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.tituloForte,
          fontSize: 26,
          color: destaque ? colors.sinalEscuro : colors.asfalto,
        }}
      >
        {valor}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 12,
          color: destaque ? colors.sinalEscuro : colors.concreto,
        }}
      >
        {rotulo}
      </Text>
    </View>
  );
}

function LinhaMenu({
  icone,
  rotulo,
  onPress,
  ultima,
}: {
  icone: ReactNode;
  rotulo: string;
  onPress: () => void;
  ultima?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: colors.linha,
        backgroundColor: pressed ? colors.calcada : 'transparent',
      })}
    >
      {icone}
      <Text style={{ flex: 1, fontFamily: fonts.semi, fontSize: 15, color: colors.asfalto }}>
        {rotulo}
      </Text>
      <ChevronRight size={18} color={colors.concreto} strokeWidth={2} />
    </Pressable>
  );
}

function Conteudo() {
  const router = useRouter();
  const toast = useToast();
  const { sessao, sair } = useSession();
  const [verDados, setVerDados] = useState(false);
  const cidadao = sessao?.perfil === 'CIDADAO';
  const hash = String(Constants.expoConfig?.extra?.commitHash ?? 'sem hash');
  const versao = Constants.expoConfig?.version ?? '1.0.0';

  const { dados: perfil } = useCarregar(() => authService.perfil(), [sessao?.idUsuario]);
  const { dados: numeros } = useCarregar(async () => {
    if (!cidadao) return null;
    const [minhas, resumo] = await Promise.all([
      ocorrenciaService.minhas(),
      atualizacaoService.resumoDaConta(),
    ]);
    return { ocorrencias: minhas.length, ...resumo };
  }, [sessao?.idUsuario]);

  const nome = perfil?.nome ?? sessao?.nome ?? '';
  const email = perfil?.email ?? sessao?.email ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <GradientView
          gradient={gradients.fundoLeve}
          style={{ paddingTop: 28, paddingHorizontal: 20, paddingBottom: 16, gap: 18 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ transform: [{ rotate: '-4deg' }] }}>
              <StickerShadow offset={3} radius={22}>
                <View
                  accessibilityLabel={`Avatar de ${nome}`}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    backgroundColor: colors.verde,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{ fontFamily: fonts.tituloForte, fontSize: 28, color: colors.calcada }}
                  >
                    {iniciais(nome)}
                  </Text>
                </View>
              </StickerShadow>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: fonts.tituloForte,
                  fontSize: 24,
                  letterSpacing: -0.24,
                  color: colors.asfalto,
                }}
              >
                {nome}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.concreto }}>
                {email}
              </Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: cidadao ? colors.broto : colors.asfalto,
                  paddingVertical: 3,
                  paddingHorizontal: 9,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.negrito,
                    fontSize: 11,
                    letterSpacing: 0.66,
                    color: cidadao ? colors.verdeEscuro : colors.calcada,
                  }}
                >
                  {cidadao ? 'CIDADÃO' : 'ADMIN'}
                </Text>
              </View>
            </View>
          </View>

          {cidadao ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Contador valor={numeros?.ocorrencias ?? '–'} rotulo="ocorrências" />
              <Contador valor={numeros?.atualizacoes ?? '–'} rotulo="atualizações" />
              <Contador
                valor={numeros?.resolvidasComAjuda ?? '–'}
                rotulo="resolvidas com sua ajuda"
                destaque
              />
            </View>
          ) : null}
        </GradientView>

        <View style={{ paddingTop: 12, paddingHorizontal: 20, gap: 12 }}>
          <View
            style={{
              backgroundColor: colors.superficie,
              borderWidth: 1,
              borderColor: colors.linha,
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <LinhaMenu
              icone={<User size={20} color={colors.asfalto} strokeWidth={1.8} />}
              rotulo="Meus dados"
              onPress={() => setVerDados(true)}
              ultima
            />
          </View>

          <Pressable
            onPress={() => router.push('/sobre')}
            accessibilityRole="link"
            accessibilityLabel="Sobre o app"
            style={{
              backgroundColor: colors.superficie,
              borderWidth: 1,
              borderColor: colors.linha,
              borderRadius: 20,
              padding: 16,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Info size={20} color={colors.verde} strokeWidth={1.8} />
              <Text
                style={{ flex: 1, fontFamily: fonts.negrito, fontSize: 15, color: colors.asfalto }}
              >
                Sobre o app
              </Text>
              <ChevronRight size={18} color={colors.concreto} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                lineHeight: 19,
                color: colors.concreto,
              }}
            >
              Bairro Vivo {versao} · FIAP Global Solution 2026/2 · CitizenTech
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
              Commit <Text style={{ fontFamily: 'monospace', color: colors.asfalto }}>{hash}</Text>
            </Text>
          </Pressable>

          <Button
            title="Sair da conta"
            variant="outlineSinal"
            radius={16}
            icon={<LogOut size={18} color={colors.sinalEscuro} strokeWidth={2} />}
            onPress={async () => {
              await sair();
              toast.show('Você saiu da conta.', 'info');
              router.replace('/login');
            }}
          />
        </View>
      </ScrollView>

      <BottomSheet
        visible={verDados}
        onClose={() => setVerDados(false)}
        accessibilityLabel="Meus dados"
      >
        <Text style={type.h2}>Meus dados</Text>
        {[
          ['Nome', nome],
          ['Email', email],
          ['Perfil', cidadao ? 'Cidadão' : 'Administrador'],
        ].map(([k, v]) => (
          <View key={k} style={{ gap: 2 }}>
            <Text style={type.label}>{k}</Text>
            <Text style={type.body}>{v}</Text>
          </View>
        ))}
        <Button title="Fechar" variant="outline" onPress={() => setVerDados(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

export function PerfilScreen() {
  const { sessao } = useSession();
  return (
    <Protegida perfil={sessao?.perfil === 'ADMIN' ? 'ADMIN' : 'CIDADAO'}>
      <Conteudo />
    </Protegida>
  );
}
