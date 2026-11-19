import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, ChevronRight, Info, Pencil, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  CategoryIcon,
  ErrorState,
  GradientView,
  Notice,
  PhotoBox,
  SkeletonList,
  StatusChip,
  Timeline,
  VoteProgress,
  tituloDoErro,
} from '@/components';
import { alvoDoVoto } from '@/domain/atualizacaoRules';
import { useCarregar } from '@/hooks/useCarregar';
import { useExigirLogin } from '@/hooks/useExigirLogin';
import { useSession } from '@/hooks/useSession';
import type { Ocorrencia, TipoAtualizacao } from '@/models';
import { atualizacaoService, MENSAGENS, ocorrenciaService } from '@/services';
import { colors, fonts, gradients, type } from '@/theme';
import { localDe, tempoRelativo } from '@/utils/format';

function BotaoRedondo({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.superficie,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 2px 8px rgba(28,35,33,0.15)',
      }}
    >
      {children}
    </Pressable>
  );
}

function Galeria({
  o,
  onBack,
  onEdit,
}: {
  o: Ocorrencia;
  onBack: () => void;
  onEdit?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(0);
  const fotos = o.midias;
  const altura = 240 + insets.top;
  const [quebradas, setQuebradas] = useState<string[]>([]);
  const atual =
    fotos[indice] && !quebradas.includes(fotos[indice].urlExibicao) ? fotos[indice] : undefined;

  return (
    <View style={{ height: altura }}>
      {atual ? (
        <Image
          source={{ uri: atual.urlExibicao }}
          accessibilityLabel={`Foto ${indice + 1} de ${fotos.length} da ocorrência`}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setQuebradas((q) => [...q, atual.urlExibicao])}
        />
      ) : (
        <PhotoBox
          width="100%"
          height={altura}
          radius={0}
          icon={
            <View style={{ alignItems: 'center', gap: 8, paddingTop: insets.top }}>
              <CategoryIcon
                icone={o.categoria.icone}
                size={36}
                color={colors.concreto}
                strokeWidth={1.6}
              />
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
                Nenhuma foto enviada ainda
              </Text>
            </View>
          }
        />
      )}
      <View style={{ position: 'absolute', left: 16, top: 16 + insets.top }}>
        <BotaoRedondo onPress={onBack} label="Voltar">
          <ChevronLeft size={20} color={colors.asfalto} strokeWidth={2} />
        </BotaoRedondo>
      </View>
      {onEdit ? (
        <View style={{ position: 'absolute', right: 16, top: 16 + insets.top }}>
          <BotaoRedondo onPress={onEdit} label="Editar minha ocorrência">
            <Pencil size={18} color={colors.asfalto} strokeWidth={2} />
          </BotaoRedondo>
        </View>
      ) : null}
      {fotos.length > 1 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próxima foto"
            onPress={() => setIndice((i) => (i + 1) % fotos.length)}
            style={{
              position: 'absolute',
              right: 16,
              top: altura / 2 - 22,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
              backgroundColor: 'rgba(28,35,33,0.45)',
            }}
          >
            <ChevronRight size={22} color="#fff" strokeWidth={2} />
          </Pressable>
        </>
      ) : null}
      {fotos.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            right: 16,
            bottom: 14,
            backgroundColor: 'rgba(28,35,33,0.75)',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Camera size={12} color="#fff" strokeWidth={2} />
          <Text style={{ fontFamily: fonts.semi, fontSize: 12, color: '#fff' }}>
            {indice + 1} / {fotos.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function Detalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sessao } = useSession();
  const exigirLogin = useExigirLogin();

  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [ocorrencia, atualizacoes, historico, jaVotei] = await Promise.all([
      ocorrenciaService.obter(id),
      atualizacaoService.listar(id),
      ocorrenciaService.historico(id),
      atualizacaoService.jaVotei(id),
    ]);
    return { ocorrencia, atualizacoes, historico, jaVotei };
  }, [id, sessao?.idUsuario]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (carregando) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }}>
        <PhotoBox width="100%" height={240} radius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonList count={2} />
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !dados) {
    const naoEncontrada = erro?.status === 404;
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.calcada, padding: 20, justifyContent: 'center' }}
      >
        <ErrorState
          title={tituloDoErro(erro)}
          message={
            naoEncontrada
              ? 'Esta ocorrência pode ter sido excluída por quem registrou.'
              : (erro?.mensagem ?? 'Tente de novo em instantes.')
          }
          action={
            naoEncontrada
              ? { label: 'Voltar ao mapa', onPress: () => router.replace('/'), variant: 'outline' }
              : { label: 'Tentar de novo', onPress: recarregar }
          }
        />
      </SafeAreaView>
    );
  }

  const { ocorrencia: o, atualizacoes, historico, jaVotei } = dados;
  const alvo = alvoDoVoto(o.status);
  const souAutor = sessao?.idUsuario === o.idAutor;
  const admin = sessao?.perfil === 'ADMIN';
  // Qual dos dois botões conta como voto no estado atual.
  const votoBloqueado = (tipo: TipoAtualizacao) =>
    jaVotei &&
    ((tipo === 'RESOLVIDO' && o.status === 'ABERTA') ||
      (tipo === 'PERSISTE' && o.status === 'RESOLVIDA'));

  const atualizar = (tipo: TipoAtualizacao) => {
    const destino = `/ocorrencia/${o.id}/atualizar?tipo=${tipo}`;
    if (exigirLogin(destino)) router.push(destino);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.calcada }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Galeria
          o={o}
          onBack={voltar}
          onEdit={souAutor ? () => router.push(`/ocorrencia/${o.id}/editar`) : undefined}
        />

        <View style={{ paddingTop: 20, paddingHorizontal: 20, gap: 18 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <StatusChip status={o.status} size="md" />
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
                {o.categoria.nome}
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: fonts.tituloForte,
                fontSize: 26,
                lineHeight: 30,
                letterSpacing: -0.52,
                color: colors.asfalto,
              }}
            >
              {o.titulo}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
              {o.autorExibicao}
              {souAutor && o.anonimoPublico ? ' (você)' : ''} · {tempoRelativo(o.dtCriacao)} ·{' '}
              {localDe(o)}
            </Text>
            <Text style={type.body}>{o.descricao}</Text>
            {o.enderecoReferencia ? (
              <Text style={{ fontFamily: fonts.medio, fontSize: 13, color: colors.concreto }}>
                Referência: {o.enderecoReferencia}
              </Text>
            ) : null}
          </View>

          {admin ? (
            <Notice icon={<Info size={18} color={colors.asfalto} strokeWidth={2} />}>
              {MENSAGENS.adminSoLeitura}
            </Notice>
          ) : (
            <Card highlight style={{ padding: 18, gap: 14 }}>
              <VoteProgress
                count={o.totalVotosCiclo}
                target={alvo}
                hint={
                  o.totalVotosCiclo >= 1
                    ? 'falta 1'
                    : alvo === 'reabrir'
                      ? 'problema voltou?'
                      : 'faltam 2'
                }
              />
              {jaVotei ? (
                <Notice tone="escuro">{MENSAGENS.votoRepetido}</Notice>
              ) : (
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.concreto }}>
                  {o.status === 'ABERTA'
                    ? 'Você passou por aqui? Conte como está.'
                    : 'Foi resolvida pela comunidade. O problema voltou?'}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Ainda continua"
                  variant="outlineSinal"
                  style={{ flex: 1 }}
                  disabled={votoBloqueado('PERSISTE')}
                  onPress={() => atualizar('PERSISTE')}
                />
                <Button
                  title="Foi resolvido"
                  style={{ flex: 1 }}
                  disabled={votoBloqueado('RESOLVIDO')}
                  onPress={() => atualizar('RESOLVIDO')}
                />
              </View>
              <Button
                title="Adicionar informação ou foto"
                variant="ghost"
                height={44}
                fontSize={14}
                icon={<Camera size={18} color={colors.verde} strokeWidth={2} />}
                onPress={() => atualizar('COMENTARIO')}
              />
            </Card>
          )}

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Como resolver este problema? A IA mostra a quem recorrer, com fonte oficial"
            onPress={() => router.push(`/ocorrencia/${o.id}/orientacao`)}
          >
            <GradientView
              gradient={gradients.brotoCone}
              style={{
                borderRadius: 20,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: colors.verde,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={24} color="#fff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fonts.titulo, fontSize: 17, color: colors.verdeEscuro }}>
                  Como resolver este problema?
                </Text>
                <Text
                  style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.verdeEscuro }}
                >
                  A IA mostra a quem recorrer, com fonte oficial
                </Text>
              </View>
              <ChevronRight size={20} color={colors.verdeEscuro} strokeWidth={2} />
            </GradientView>
          </Pressable>

          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={type.h2}>
              Histórico
            </Text>
            <Timeline
              ocorrencia={o}
              atualizacoes={atualizacoes}
              historico={historico}
              idUsuario={sessao?.idUsuario}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
