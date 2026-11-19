import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, AuthTitle, Button, FormField, Notice, useToast } from '@/components';
import { validarCadastro } from '@/domain/authRules';
import { destinoSeguro, rotaInicial } from '@/hooks/useExigirLogin';
import { useSession } from '@/hooks/useSession';
import { paraErroServico } from '@/services';
import { colors, fonts } from '@/theme';

export default function Cadastro() {
  const router = useRouter();
  const toast = useToast();
  const { voltar } = useLocalSearchParams<{ voltar?: string }>();
  const { cadastrar } = useSession();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmacaoSenha: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (k: keyof typeof form) => ({
    value: form[k],
    onChangeText: (v: string) => {
      setForm((f) => ({ ...f, [k]: v }));
      if (erros[k]) setErros((e) => ({ ...e, [k]: '' }));
    },
    error: erros[k] || undefined,
  });

  const voltarLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const enviar = async () => {
    setErroGeral(null);
    const locais = validarCadastro(form);
    if (Object.keys(locais).length) {
      setErros(locais as Record<string, string>);
      return;
    }
    setEnviando(true);
    try {
      const s = await cadastrar(form);
      toast.show(`Conta criada. Bem-vindo, ${s.nome.split(' ')[0]}!`);
      router.replace(destinoSeguro(voltar) ?? rotaInicial(s.perfil));
    } catch (e) {
      const erro = paraErroServico(e);
      if (erro.campos) setErros(erro.campos);
      else setErroGeral(erro.mensagem);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppBar bare onBack={voltarLogin} backLabel="Voltar ao login" />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32, gap: 18 }}
        >
          <AuthTitle
            titulo="Criar conta"
            texto="Com uma conta você registra problemas e confirma quando foram resolvidos. Pode publicar como anônimo quando quiser."
          />
          <FormField label="Nome" autoComplete="name" {...campo('nome')} />
          <FormField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            {...campo('email')}
          />
          <FormField
            label="Senha"
            password
            autoComplete="new-password"
            helper="Mínimo de 8 caracteres"
            {...campo('senha')}
          />
          <FormField
            label="Confirmar senha"
            password
            autoComplete="new-password"
            onSubmitEditing={enviar}
            {...campo('confirmacaoSenha')}
          />
          {erroGeral ? <Notice tone="alerta">{erroGeral}</Notice> : null}
          <Button
            title="Criar conta"
            onPress={enviar}
            loading={enviando}
            fontSize={16}
            style={{ marginTop: 4 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.concreto }}>
              Já tem conta?
            </Text>
            <Pressable accessibilityRole="link" onPress={voltarLogin} hitSlop={12}>
              <Text style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.sinal }}>
                Entrar
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
