import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  Database,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  SearchX,
  TriangleAlert,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Button, ErrorState, GradientView, Overline, StickerShadow } from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import type { OrientacaoCidada } from '@/models';
import { ocorrenciaService, orientacaoService } from '@/services';
import { colors, fonts, gradients } from '@/theme';
import { dataCurta, localDe } from '@/utils/format';

function abrirCanal(c: OrientacaoCidada['canais'][number]) {
  if (c.tipo === 'TELEFONE') {
    const numero = c.valor.match(/\d+/)?.[0];
    if (numero) Linking.openURL(`tel:${numero}`).catch(() => undefined);
  } else if (c.tipo === 'SITE') {
    const url = c.valor.startsWith('http') ? c.valor : `https://${c.valor}`;
    Linking.openURL(url).catch(() => undefined);
  }
}

function IconeCanal({ tipo }: { tipo: OrientacaoCidada['canais'][number]['tipo'] }) {
  const p = { size: 20, color: colors.asfalto, strokeWidth: 1.8 };
  if (tipo === 'TELEFONE') return <Phone {...p} />;
  if (tipo === 'SITE') return <Globe {...p} />;
  return <MapPin {...p} />;
}

function rotuloCanal(c: OrientacaoCidada['canais'][number]): { titulo: string; apoio: string } {
  if (c.tipo === 'TELEFONE') {
    const [numero, ...resto] = c.valor.split(' ');
    const extra = resto.join(' ').replace(/[()]/g, '');
    return {
      titulo: `Telefone ${numero}`,
      apoio: [extra || 'Central de atendimento', c.horario].filter(Boolean).join(' · '),
    };
  }
  if (c.tipo === 'SITE') return { titulo: 'Site oficial', apoio: c.valor };
  return { titulo: c.valor, apoio: c.horario ?? '' };
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.superficie,
        borderWidth: 1,
        borderColor: colors.linha,
        borderRadius: 20,
        padding: 18,
        gap: 12,
      }}
    >
      <Overline>{titulo}</Overline>
      {children}
    </View>
  );
}

function SeloEstado({ estado }: { estado: OrientacaoCidada['estado'] }) {
  const ok = estado === 'DISPONIVEL' || estado === 'PARCIAL';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: ok ? colors.broto : colors.sinalClaro,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
      }}
    >
      {ok ? (
        <Check size={14} color={colors.verdeEscuro} strokeWidth={2.6} />
      ) : (
        <SearchX size={14} color={colors.sinalEscuro} strokeWidth={2.2} />
      )}
      <Text
        style={{
          fontFamily: fonts.negrito,
          fontSize: 13,
          color: ok ? colors.verdeEscuro : colors.sinalEscuro,
        }}
      >
        {estado === 'DISPONIVEL'
          ? 'Fontes oficiais encontradas'
          : estado === 'PARCIAL'
            ? 'Parte das informações confirmada'
            : estado === 'LOCALIDADE_NAO_CONFIRMADA'
              ? 'Município ainda sem base'
              : 'Não encontramos fonte oficial'}
      </Text>
    </View>
  );
}

/** Tela "Como resolver" (Orientacao.dc.html). STANDBY: hoje usa a base local. */
export default function Orientacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [ocorrencia, orientacao] = await Promise.all([
      ocorrenciaService.obter(id),
      orientacaoService.obter(id),
    ]);
    return { ocorrencia, orientacao };
  }, [id]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace(`/ocorrencia/${id}`));

  let corpo: ReactNode;
  if (carregando) {
    corpo = (
      <View style={{ paddingVertical: 60, alignItems: 'center', gap: 14 }}>
        <ActivityIndicator color={colors.verde} size="large" />
        <Text style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.asfalto }}>
          Consultando fontes oficiais...
        </Text>
      </View>
    );
  } else if (erro || !dados) {
    corpo = (
      <ErrorState
        title={erro?.status === 404 ? 'Registro indisponível' : 'Orientação indisponível agora'}
        message={
          erro?.status === 404
            ? 'Esta ocorrência pode ter sido excluída por quem registrou.'
            : 'Não conseguimos consultar as fontes. Nada foi inventado: tente de novo em instantes.'
        }
        action={{ label: 'Tentar de novo', onPress: recarregar }}
      />
    );
  } else {
    const { ocorrencia: o, orientacao: ori } = dados;
    const temConteudo = ori.estado === 'DISPONIVEL' || ori.estado === 'PARCIAL';
    corpo = (
      <>
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
            {o.titulo} · {localDe(o)}
          </Text>
          <SeloEstado estado={ori.estado} />
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.areia,
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 999,
            }}
          >
            <Database size={12} color={colors.asfalto} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semi, fontSize: 12, color: colors.asfalto }}>
              {ori.origem === 'IA_JAVA'
                ? 'Gerada pela IA da API Java (Spring AI + RAG)'
                : 'Base de orientação com fontes oficiais'}
            </Text>
          </View>
        </View>

        {temConteudo ? (
          <>
            <StickerShadow offset={4} radius={20}>
              <GradientView
                gradient={gradients.brotoCone}
                style={{
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: colors.asfalto,
                  padding: 18,
                  gap: 10,
                }}
              >
                <Overline>QUEM RESOLVE</Overline>
                <Text
                  style={{
                    fontFamily: fonts.titulo,
                    fontSize: 20,
                    lineHeight: 25,
                    color: colors.asfalto,
                  }}
                >
                  {ori.orgaoResponsavel ?? 'Informação não confirmada'}
                </Text>
                {ori.servico ? (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                      lineHeight: 22,
                      color: colors.asfalto,
                    }}
                  >
                    {ori.servico}
                  </Text>
                ) : null}
              </GradientView>
            </StickerShadow>

            {ori.canais.length > 0 ? (
              <Bloco titulo="ONDE PEDIR">
                {ori.canais.map((c, i) => {
                  const r = rotuloCanal(c);
                  return (
                    <Pressable
                      key={`${c.tipo}-${i}`}
                      onPress={() => abrirCanal(c)}
                      accessibilityRole="link"
                      accessibilityLabel={`${r.titulo}. ${r.apoio}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: colors.calcada,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconeCanal tipo={c.tipo} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.asfalto }}
                        >
                          {r.titulo}
                        </Text>
                        {r.apoio ? (
                          <Text
                            style={{
                              fontFamily: fonts.regular,
                              fontSize: 13,
                              color: colors.concreto,
                            }}
                          >
                            {r.apoio}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </Bloco>
            ) : null}

            {ori.passos.length > 0 ? (
              <Bloco titulo="PASSO A PASSO">
                {ori.passos.map((p, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: colors.sinal,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: fonts.negrito, fontSize: 13, color: '#fff' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        lineHeight: 21,
                        color: colors.asfalto,
                      }}
                    >
                      {p}
                    </Text>
                  </View>
                ))}
              </Bloco>
            ) : null}

            {ori.cuidados.map((c, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.sinalClaro,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <TriangleAlert size={20} color={colors.sinalEscuro} strokeWidth={2} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    lineHeight: 21,
                    color: colors.sinalEscuro,
                  }}
                >
                  Cuidado: {c}
                </Text>
              </View>
            ))}

            {ori.fontes.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Overline>FONTES</Overline>
                {ori.fontes.map((f) => (
                  <Pressable
                    key={f.url}
                    onPress={() => Linking.openURL(f.url).catch(() => undefined)}
                    accessibilityRole="link"
                    accessibilityLabel={`Abrir fonte: ${f.titulo}`}
                    style={{
                      backgroundColor: colors.superficie,
                      borderWidth: 1,
                      borderColor: colors.linha,
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.semi, fontSize: 14, color: colors.verde }}>
                        {f.titulo}
                      </Text>
                      <Text
                        style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}
                      >
                        {f.verificadaEm
                          ? `Verificado em ${dataCurta(f.verificadaEm)}`
                          : 'Confira as informações no site oficial'}
                      </Text>
                    </View>
                    <ExternalLink size={18} color={colors.concreto} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View
            style={{
              backgroundColor: colors.superficie,
              borderWidth: 1,
              borderColor: colors.linha,
              borderRadius: 20,
              padding: 18,
              gap: 10,
            }}
          >
            <SearchX size={32} color={colors.concreto} strokeWidth={1.6} />
            <Text style={{ fontFamily: fonts.titulo, fontSize: 18, color: colors.asfalto }}>
              {ori.estado === 'LOCALIDADE_NAO_CONFIRMADA'
                ? `Ainda não temos fontes para ${o.municipio.nome}`
                : 'Não encontramos fonte oficial para este caso'}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                lineHeight: 21,
                color: colors.concreto,
              }}
            >
              Preferimos não inventar telefone, horário ou órgão. Procure o canal oficial de
              atendimento da prefeitura do seu município.
            </Text>
          </View>
        )}

        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            lineHeight: 18,
            color: colors.concreto,
          }}
        >
          {ori.origem === 'IA_JAVA'
            ? 'Gerado por IA a partir de fontes oficiais.'
            : 'Base local de demonstração montada a partir de canais oficiais, usada enquanto a IA da API Java não responde.'}{' '}
          O Bairro Vivo não abre protocolo nem fala pela prefeitura. Confira o canal antes de usar.
        </Text>
        <Button title="Voltar à ocorrência" variant="outline" onPress={voltar} />
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <AppBar title="Como resolver" onBack={voltar} backLabel="Voltar à ocorrência" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        {corpo}
      </ScrollView>
    </SafeAreaView>
  );
}
