import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, TriangleAlert } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button, GradientView, ResolvedSeal, StatusChip } from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import type { StatusOcorrencia } from '@/models';
import { ocorrenciaService } from '@/services';
import { colors, fonts, GradientSpec } from '@/theme';

/** Variação do verde profundo usada na tela de comemoração (170°). */
const FUNDO: GradientSpec = {
  colors: ['#2A8A5A', '#1F7A4D', '#14532D'],
  locations: [0, 0.4, 1],
  angle: 170,
};

/** Tela "Resolvida pela comunidade" (VotoConfirmado.dc.html). */
export default function Resolvida() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    de?: string;
    para?: string;
    cicloDe?: string;
    cicloPara?: string;
  }>();
  const { dados: o } = useCarregar(() => ocorrenciaService.obter(params.id), [params.id]);

  const para: StatusOcorrencia = params.para === 'ABERTA' ? 'ABERTA' : 'RESOLVIDA';
  const de: StatusOcorrencia = para === 'ABERTA' ? 'RESOLVIDA' : 'ABERTA';
  const resolvida = para === 'RESOLVIDA';
  const titulo = o?.titulo ?? 'A ocorrência';

  return (
    <GradientView
      gradient={FUNDO}
      glow={{ x: 0.9, y: 0.08, reach: 0.4, opacity: 0.55 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <Svg
        width="100%"
        height={320}
        viewBox="0 0 390 320"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Path d="M-20 90 L410 50" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={18} />
        <Path d="M110 -10 L150 330" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={14} />
        <Path d="M290 -10 L270 330" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={10} />
      </Svg>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 72 + insets.top,
          paddingHorizontal: 28,
          paddingBottom: 32 + insets.bottom,
          gap: 28,
        }}
      >
        <View style={{ alignSelf: 'flex-start' }}>
          {resolvida ? (
            <ResolvedSeal size={132} />
          ) : (
            <View
              accessibilityLabel="Selo de reaberta"
              style={{
                width: 120,
                height: 120,
                borderRadius: 30,
                backgroundColor: colors.superficie,
                borderWidth: 2,
                borderColor: colors.asfalto,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-6deg' }],
                boxShadow: `6px 6px 0px ${colors.verdeEscuro}`,
              }}
            >
              <TriangleAlert size={56} color={colors.sinal} strokeWidth={2.2} />
            </View>
          )}
        </View>

        <View style={{ gap: 12 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.tituloForte,
              fontSize: 38,
              lineHeight: 40,
              letterSpacing: -0.76,
              color: colors.calcada,
            }}
          >
            {resolvida ? 'Resolvida pela comunidade' : 'Reaberta pela comunidade'}
            <Text style={{ color: colors.sinalSuave }}>.</Text>
          </Text>
          <Text
            style={{ fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.broto }}
          >
            Sua confirmação foi a segunda. “{titulo}” agora aparece como{' '}
            {resolvida ? 'resolvida' : 'aberta de novo'} para todo mundo.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 18,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <StatusChip status={de} plain />
          <ArrowRight size={22} color={colors.calcada} strokeWidth={2} />
          <StatusChip status={para} plain />
          <Text
            style={{
              flex: 1,
              textAlign: 'right',
              fontFamily: fonts.regular,
              fontSize: 13,
              color: colors.broto,
            }}
          >
            ciclo {params.cicloDe ?? '?'} → {params.cicloPara ?? '?'}
          </Text>
        </View>

        <Text
          style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.broto }}
        >
          {resolvida
            ? 'Se o problema voltar, qualquer vizinho pode marcar “ainda continua”. Com 2 confirmações, ela reabre.'
            : 'Quando o problema for resolvido, qualquer vizinho pode marcar “foi resolvido”. Com 2 confirmações, ela fecha de novo.'}
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 12 }}>
          <Button
            title="Ver ocorrência"
            variant="light"
            height={56}
            radius={16}
            fontSize={16}
            onPress={() => router.replace(`/ocorrencia/${params.id}`)}
          />
          <Button
            title="Voltar ao mapa"
            variant="lightOutline"
            radius={16}
            fontSize={16}
            onPress={() => router.dismissTo('/')}
          />
        </View>
      </ScrollView>
    </GradientView>
  );
}
