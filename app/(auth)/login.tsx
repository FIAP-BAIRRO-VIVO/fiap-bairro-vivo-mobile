import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AuthTitle, Button, FormField, GradientView, Logo, Notice, Wordmark } from '@/components';
import { TabIcon } from '@/components/TabIcons';
import { destinoSeguro, rotaInicial } from '@/hooks/useExigirLogin';
import { useSession } from '@/hooks/useSession';
import { paraErroServico } from '@/services';
import { colors, fonts, gradients } from '@/theme';

/** Topo verde profundo com ruas desenhadas, como no mockup Login.dc.html. */
function TopoLogin() {
  const insets = useSafeAreaInsets();
  return (
    <GradientView
      gradient={gradients.verdeProfundo}
      glow={{ x: 0.88, y: 0.18, reach: 0.42 }}
      style={{ height: 260 + insets.top }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 260"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: insets.top }}
      >
        <Path d="M-20 70 L410 30" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={18} />
        <Path d="M-20 170 L410 140" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={12} />
        <Path d="M90 -10 L130 280" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={16} />
        <Path d="M270 -10 L250 280" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={10} />
        <Rect x={150} y={70} width={80} height={60} rx={10} fill="#FFFFFF" fillOpacity={0.07} />
        <Circle cx={200} cy={200} r={7} fill={colors.calcada} />
        <Circle cx={60} cy={120} r={7} fill={colors.sinalClaro} />
        <Circle cx={320} cy={90} r={7} fill={colors.calcada} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -1,
          height: 48,
          backgroundColor: colors.calcada,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 32,
          top: 84 + insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Logo size={60} />
        <Wordmark size={34} color={colors.calcada} dotColor={colors.sinalSuave} />
      </View>
    </GradientView>
  );
}

export default function Login() {
  const router = useRouter();
  const { voltar } = useLocalSearchParams<{ voltar?: string }>();
  const { sessao, carregando, entrar, entrarComoVisitante } = useSession();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [demorando, setDemorando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  if (!carregando && sessao && !enviando) {
    return <Redirect href={rotaInicial(sessao.perfil)} />;
  }

  const enviar = async () => {
    // O servidor gratuito da API pode levar até 1 minuto para acordar.
    const aviso = setTimeout(() => setDemorando(true), 4000);
    setErros({});
    setErroGeral(null);
    setEnviando(true);
    try {
      const s = await entrar({ email, senha });
      const destino = destinoSeguro(voltar);
      router.replace(s.perfil === 'CIDADAO' && destino ? destino : rotaInicial(s.perfil));
    } catch (e) {
      const erro = paraErroServico(e);
      if (erro.campos) setErros(erro.campos);
      else setErroGeral(erro.mensagem);
    } finally {
      clearTimeout(aviso);
      setDemorando(false);
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.calcada }}
        keyboardShouldPersistTaps="handled"
      >
        <TopoLogin />
        <View style={{ flex: 1, paddingTop: 8, paddingHorizontal: 28, paddingBottom: 32, gap: 20 }}>
          <AuthTitle
            titulo="Entrar"
            texto="Entre para registrar problemas e confirmar quando foram resolvidos."
          />
          <FormField
            label="Email"
            placeholder="nome@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={erros.email}
          />
          <FormField
            label="Senha"
            password
            autoComplete="password"
            value={senha}
            onChangeText={setSenha}
            error={erros.senha}
            onSubmitEditing={enviar}
            returnKeyType="go"
          />
          {erroGeral ? <Notice tone="alerta">{erroGeral}</Notice> : null}
          <Button title="Entrar" onPress={enviar} loading={enviando} fontSize={16} />
          {demorando ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: colors.concreto,
                textAlign: 'center',
              }}
            >
              Acordando o servidor… a primeira conexão pode levar até 1 minuto.
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.concreto }}>
              Ainda não tem conta?
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                router.push(voltar ? { pathname: '/cadastro', params: { voltar } } : '/cadastro')
              }
              hitSlop={12}
            >
              <Text style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.sinal }}>
                Criar conta
              </Text>
            </Pressable>
          </View>
          <View style={{ flex: 1, minHeight: 12 }} />
          <Button
            title="Explorar o mapa sem entrar"
            variant="outline"
            icon={<TabIcon name="mapa" focused={false} size={18} />}
            onPress={() => {
              entrarComoVisitante();
              router.replace('/');
            }}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
