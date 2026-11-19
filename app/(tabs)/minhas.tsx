import { useRouter } from 'expo-router';
import { EyeOff, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  ErrorState,
  ExcluirSheet,
  Protegida,
  SkeletonList,
  StatusChip,
  TitleHighlight,
  useToast,
  tituloDoErro,
} from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import type { HistoricoStatus, Ocorrencia, StatusOcorrencia } from '@/models';
import { atualizacaoService, ocorrenciaService, paraErroServico } from '@/services';
import { colors, fonts } from '@/theme';
import { resumoVotos, tempoRelativo } from '@/utils/format';

type Aba = 'TODAS' | StatusOcorrencia;

interface Item {
  o: Ocorrencia;
  totalAtualizacoes: number;
  ultimaMudanca?: HistoricoStatus;
}

function linhaMinhas({ o, totalAtualizacoes, ultimaMudanca }: Item): string {
  if (o.status === 'RESOLVIDA' && ultimaMudanca) {
    return `${o.categoria.nome} · resolvida pela comunidade ${tempoRelativo(ultimaMudanca.dtEvento)}`;
  }
  const partes = [o.categoria.nome, tempoRelativo(o.dtCriacao)];
  partes.push(totalAtualizacoes === 0 ? 'sem atualizações ainda' : resumoVotos(o));
  return partes.join(' · ');
}

function CartaoMinha({
  item,
  onAbrir,
  onEditar,
  onExcluir,
}: {
  item: Item;
  onAbrir: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const { o } = item;
  return (
    <View
      style={{
        backgroundColor: colors.superficie,
        borderWidth: 1,
        borderColor: colors.linha,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onAbrir}
        accessibilityRole="link"
        accessibilityLabel={`${o.titulo}. ${o.status === 'ABERTA' ? 'Aberta' : 'Resolvida'}${o.anonimoPublico ? '. Publicada como anônima' : ''}`}
        style={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12, gap: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusChip status={o.status} />
          {o.anonimoPublico ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.areia,
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 999,
              }}
            >
              <EyeOff size={11} color={colors.asfalto} strokeWidth={2.2} />
              <Text style={{ fontFamily: fonts.semi, fontSize: 11, color: colors.asfalto }}>
                Publicada como anônima
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{ fontFamily: fonts.titulo, fontSize: 17, lineHeight: 20, color: colors.asfalto }}
        >
          {o.titulo}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
          {linhaMinhas(item)}
        </Text>
      </Pressable>
      {o.status === 'ABERTA' ? (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.linha }}>
          <Pressable
            onPress={onEditar}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${o.titulo}`}
            style={{
              flex: 1,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRightWidth: 1,
              borderRightColor: colors.linha,
            }}
          >
            <Pencil size={16} color={colors.asfalto} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semi, fontSize: 14, color: colors.asfalto }}>
              Editar
            </Text>
          </Pressable>
          <Pressable
            onPress={onExcluir}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${o.titulo}`}
            style={{
              flex: 1,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={16} color={colors.sinalEscuro} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semi, fontSize: 14, color: colors.sinalEscuro }}>
              Excluir
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.linha,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 19,
              color: colors.concreto,
            }}
          >
            Resolvida pela comunidade: a situação só muda com novas confirmações. O histórico fica
            guardado para sempre.
          </Text>
        </View>
      )}
    </View>
  );
}

function Minhas() {
  const router = useRouter();
  const toast = useToast();
  const [aba, setAba] = useState<Aba>('TODAS');
  const [excluir, setExcluir] = useState<Ocorrencia | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const lista = await ocorrenciaService.minhas();
    return Promise.all(
      lista.map(async (o): Promise<Item> => {
        const [atualizacoes, historico] = await Promise.all([
          atualizacaoService.listar(o.id),
          ocorrenciaService.historico(o.id),
        ]);
        return {
          o,
          totalAtualizacoes: atualizacoes.length,
          ultimaMudanca: historico[historico.length - 1],
        };
      }),
    );
  });

  const itens = dados ?? [];
  const contagem = {
    TODAS: itens.length,
    ABERTA: itens.filter((i) => i.o.status === 'ABERTA').length,
    RESOLVIDA: itens.filter((i) => i.o.status === 'RESOLVIDA').length,
  };
  const visiveis = aba === 'TODAS' ? itens : itens.filter((i) => i.o.status === aba);

  const confirmarExclusao = async () => {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await ocorrenciaService.excluir(excluir.id);
      toast.show('Ocorrência excluída. O histórico fica guardado.');
      setExcluir(null);
      recarregar();
    } catch (e) {
      toast.show(paraErroServico(e).mensagem, 'aviso');
    } finally {
      setExcluindo(false);
    }
  };

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'TODAS', rotulo: 'Todas' },
    { id: 'ABERTA', rotulo: 'Abertas' },
    { id: 'RESOLVIDA', rotulo: 'Resolvidas' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <FlatList
        data={carregando || erro ? [] : visiveis}
        keyExtractor={(i) => i.o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, gap: 14 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 20, paddingBottom: 8, gap: 14 }}>
            <TitleHighlight>Minhas ocorrências</TitleHighlight>
            <View
              accessibilityRole="tablist"
              accessibilityLabel="Filtrar por situação"
              style={{
                flexDirection: 'row',
                backgroundColor: colors.areia,
                borderRadius: 14,
                padding: 4,
                gap: 4,
              }}
            >
              {abas.map((a) => {
                const sel = a.id === aba;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setAba(a.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: sel }}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel ? colors.superficie : 'transparent',
                      boxShadow: sel ? '0px 1px 3px rgba(28,35,33,0.12)' : undefined,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: sel ? fonts.negrito : fonts.semi,
                        fontSize: 14,
                        color: sel ? colors.asfalto : colors.concreto,
                      }}
                    >
                      {a.rotulo} · {carregando ? '–' : contagem[a.id]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {carregando ? <SkeletonList count={3} /> : null}
            {erro ? (
              <ErrorState
                title={tituloDoErro(erro)}
                message={erro.mensagem}
                action={{ label: 'Tentar de novo', onPress: recarregar }}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <CartaoMinha
            item={item}
            onAbrir={() => router.push(`/ocorrencia/${item.o.id}`)}
            onEditar={() => router.push(`/ocorrencia/${item.o.id}/editar`)}
            onExcluir={() => setExcluir(item.o)}
          />
        )}
        ListEmptyComponent={
          !carregando && !erro ? (
            <EmptyState
              title={
                aba === 'TODAS'
                  ? 'Você ainda não registrou nada'
                  : aba === 'ABERTA'
                    ? 'Nenhuma ocorrência aberta'
                    : 'Nenhuma resolvida ainda'
              }
              message="Viu algum problema no caminho? Registre e acompanhe por aqui."
              action={{
                label: 'Registrar ocorrência',
                onPress: () => router.push('/ocorrencia/nova'),
              }}
            />
          ) : undefined
        }
      />
      <Button
        title="Registrar"
        variant="register"
        radius={16}
        icon={<Plus size={20} color="#fff" strokeWidth={2.2} />}
        onPress={() => router.push('/ocorrencia/nova')}
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        accessibilityLabel="Registrar nova ocorrência"
      />
      <ExcluirSheet
        visible={!!excluir}
        titulo={excluir?.titulo ?? ''}
        excluindo={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluir(null)}
      />
    </SafeAreaView>
  );
}

export default function Tela() {
  return (
    <Protegida perfil="CIDADAO">
      <Minhas />
    </Protegida>
  );
}
