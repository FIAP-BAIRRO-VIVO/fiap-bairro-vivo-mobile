import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Button, Card, Logo, Overline, useToast, Wordmark } from '@/components';
import { DATA_SOURCE } from '@/config/env';
import { useSession } from '@/hooks/useSession';
import { dadosService, paraErroServico, recursos } from '@/services';
import { colors, fonts, type } from '@/theme';

const TOQUES_PARA_REVELAR = 5;

/** Sobre o app: versão, projeto e hash do commit (app.json > extra.commitHash). */
export default function Sobre() {
  const router = useRouter();
  const toast = useToast();
  const { sessao } = useSession();
  const [toques, setToques] = useState(0);
  const [restaurando, setRestaurando] = useState(false);
  const versao = Constants.expoConfig?.version ?? '1.0.0';
  const hash = String(Constants.expoConfig?.extra?.commitHash ?? 'sem hash');
  const revelado = recursos.restaurarDados && toques >= TOQUES_PARA_REVELAR;

  const restaurar = async () => {
    setRestaurando(true);
    try {
      await dadosService.restaurarDadosExemplo();
      toast.show('Dados de exemplo restaurados.');
      router.replace('/');
    } catch (e) {
      toast.show(paraErroServico(e).mensagem, 'aviso');
    } finally {
      setRestaurando(false);
    }
  };

  const linhas: [string, string][] = [
    ['Versão', versao],
    ['Commit', hash],
    ['Projeto', 'FIAP Global Solution 2026/2 · CitizenTech'],
    ['Disciplina', 'Mobile Application Development'],
    ['Fonte de dados', DATA_SOURCE === 'local' ? 'Local (AsyncStorage)' : 'API .NET + API Java'],
    [
      'Login (JWT)',
      sessao?.emissor === 'JAVA'
        ? 'API Java (oficial)'
        : sessao?.emissor === 'TESTE_DOTNET'
          ? 'Gerador de teste da API .NET (só testes)'
          : sessao
            ? 'Local'
            : 'Sem sessão',
    ],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <AppBar
        title="Sobre o app"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        <Pressable
          onPress={() => setToques((t) => t + 1)}
          accessibilityRole="image"
          accessibilityLabel="Bairro Vivo"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Logo size={64} pinShadow />
          <View style={{ gap: 4, flex: 1 }}>
            <Wordmark size={30} />
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.concreto }}>
              Seu bairro, mapeado por quem vive nele.
            </Text>
          </View>
        </Pressable>

        <Text style={type.body}>
          Moradores registram problemas urbanos, acompanham no mapa e decidem juntos quando foram
          resolvidos: duas confirmações de contas diferentes fecham a ocorrência; duas de que
          &quot;ainda continua&quot; reabrem.
        </Text>

        <Card style={{ padding: 16, gap: 12 }}>
          {linhas.map(([k, v]) => (
            <View
              key={k}
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
            >
              <Text style={{ fontFamily: fonts.semi, fontSize: 14, color: colors.asfalto }}>
                {k}
              </Text>
              <Text
                selectable
                style={{
                  flexShrink: 1,
                  textAlign: 'right',
                  fontFamily: k === 'Commit' ? 'monospace' : fonts.regular,
                  fontSize: 14,
                  color: colors.concreto,
                }}
              >
                {v}
              </Text>
            </View>
          ))}
        </Card>

        <View style={{ gap: 8 }}>
          <Overline>INTEGRAÇÕES PENDENTES</Overline>
          <Text style={type.small}>
            Login, cadastro, perfil e a IA de orientação virão da API Java; ocorrências, votos,
            categorias e relatórios, da API .NET. Enquanto os contratos não são liberados, o app
            funciona 100% local.
          </Text>
        </View>

        {revelado ? (
          <View style={{ gap: 8 }}>
            <Overline>MODO DEMONSTRAÇÃO</Overline>
            <Button
              title="Restaurar dados de exemplo"
              variant="outline"
              icon={<RotateCcw size={18} color={colors.asfalto} strokeWidth={2} />}
              loading={restaurando}
              onPress={restaurar}
            />
            <Text style={type.small}>
              Apaga o que foi criado neste aparelho e volta às 8 ocorrências de exemplo.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
