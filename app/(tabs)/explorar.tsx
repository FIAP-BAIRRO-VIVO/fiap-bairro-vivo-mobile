import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  ErrorState,
  FilterChip,
  FilterSelect,
  GradientView,
  OcorrenciaCard,
  SkeletonList,
  TitleHighlight,
  tituloDoErro,
} from '@/components';
import { useCatalogo } from '@/hooks/useCatalogo';
import { useExigirLogin } from '@/hooks/useExigirLogin';
import type { ErroServico, Ocorrencia, OrdemOcorrencias, StatusOcorrencia } from '@/models';
import { ocorrenciaService, paraErroServico } from '@/services';
import { colors, fonts, gradients } from '@/theme';

const TAMANHO = 10;

type FiltroStatus = 'TODAS' | StatusOcorrencia;

const ORDENS: { value: OrdemOcorrencias; label: string }[] = [
  { value: 'RECENTES', label: 'Recentes' },
  { value: 'ANTIGAS', label: 'Mais antigas' },
  { value: 'MAIS_VOTADAS', label: 'Mais confirmações' },
];

export default function Explorar() {
  const router = useRouter();
  const exigirLogin = useExigirLogin();
  const { categorias, municipios } = useCatalogo(true);
  const [status, setStatus] = useState<FiltroStatus>('TODAS');
  const [categoriaId, setCategoriaId] = useState('');
  const [municipioId, setMunicipioId] = useState('');
  const [ordem, setOrdem] = useState<OrdemOcorrencias>('RECENTES');

  const [itens, setItens] = useState<Ocorrencia[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<ErroServico | null>(null);

  const buscar = useCallback(
    async (p: number) => {
      const r = await ocorrenciaService.listar({
        pagina: p,
        tamanho: TAMANHO,
        status: status === 'TODAS' ? undefined : status,
        categoriaId: categoriaId || undefined,
        municipioId: municipioId || undefined,
        ordem,
      });
      return r;
    },
    [status, categoriaId, municipioId, ordem],
  );

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await buscar(1);
      setItens(r.itens);
      setTotal(r.total);
      setPagina(1);
    } catch (e) {
      setErro(paraErroServico(e));
    } finally {
      setCarregando(false);
    }
  }, [buscar]);

  // Recarrega ao abrir a aba e quando os filtros mudam.
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  const carregarMais = async () => {
    setCarregandoMais(true);
    try {
      const r = await buscar(pagina + 1);
      // Se algo foi registrado entre uma página e outra, a lista desloca: evita repetidos.
      setItens((atual) => [...atual, ...r.itens.filter((o) => !atual.some((x) => x.id === o.id))]);
      setTotal(r.total);
      setPagina(pagina + 1);
    } catch (e) {
      setErro(paraErroServico(e));
    } finally {
      setCarregandoMais(false);
    }
  };

  const filtrosAtivos = status !== 'TODAS' || !!categoriaId || !!municipioId;

  const cabecalho = (
    <GradientView
      gradient={gradients.fundoLeve}
      style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 12, gap: 14 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TitleHighlight>Explorar</TitleHighlight>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
          {carregando ? ' ' : `${total} ${total === 1 ? 'ocorrência' : 'ocorrências'}`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <FilterChip
          label="Todas"
          selected={status === 'TODAS'}
          onPress={() => setStatus('TODAS')}
        />
        <FilterChip
          label="Abertas"
          dot={colors.sinal}
          selected={status === 'ABERTA'}
          onPress={() => setStatus('ABERTA')}
        />
        <FilterChip
          label="Resolvidas"
          dot={colors.verde}
          selected={status === 'RESOLVIDA'}
          onPress={() => setStatus('RESOLVIDA')}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <FilterSelect
          title="Categoria"
          placeholder="Categoria"
          value={categoriaId}
          emptyValue=""
          onChange={setCategoriaId}
          options={[
            { value: '', label: 'Todas as categorias' },
            ...categorias.map((c) => ({ value: c.id, label: c.nome })),
          ]}
        />
        <FilterSelect
          title="Município"
          placeholder="Município"
          value={municipioId}
          emptyValue=""
          onChange={setMunicipioId}
          options={[
            { value: '', label: 'Todos os municípios' },
            ...municipios.map((m) => ({ value: m.id, label: m.nome })),
          ]}
        />
        <FilterSelect
          title="Ordenar por"
          placeholder="Recentes"
          value={ordem}
          emptyValue="RECENTES"
          onChange={setOrdem}
          options={ORDENS}
        />
      </View>
    </GradientView>
  );

  let corpo = null;
  if (carregando) corpo = <SkeletonList count={4} />;
  else if (erro)
    corpo = (
      <ErrorState
        title={tituloDoErro(erro)}
        message={erro.mensagem}
        action={{ label: 'Tentar de novo', onPress: recarregar }}
      />
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <FlatList
        data={carregando || erro ? [] : itens}
        keyExtractor={(o) => o.id}
        ListHeaderComponent={
          <>
            {cabecalho}
            {corpo ? <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>{corpo}</View> : null}
          </>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <OcorrenciaCard o={item} onPress={() => router.push(`/ocorrencia/${item.id}`)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          !carregando && !erro ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
              <EmptyState
                title={filtrosAtivos ? 'Nada com esses filtros' : 'Nenhuma ocorrência por aqui'}
                message={
                  filtrosAtivos
                    ? 'Tente outra categoria, município ou situação.'
                    : 'Viu algum problema por aqui? Seja o primeiro a registrar.'
                }
                action={
                  filtrosAtivos
                    ? {
                        label: 'Limpar filtros',
                        onPress: () => {
                          setStatus('TODAS');
                          setCategoriaId('');
                          setMunicipioId('');
                        },
                      }
                    : {
                        label: 'Registrar ocorrência',
                        onPress: () =>
                          exigirLogin('/ocorrencia/nova') && router.push('/ocorrencia/nova'),
                      }
                }
              />
            </View>
          ) : undefined
        }
        ListFooterComponent={
          !carregando && !erro && itens.length > 0 ? (
            <View style={{ alignItems: 'center', gap: 6, paddingTop: 16 }}>
              {itens.length < total ? (
                <Button
                  title="Carregar mais"
                  variant="outline"
                  height={48}
                  fontSize={14}
                  loading={carregandoMais}
                  onPress={carregarMais}
                  style={{ minWidth: 160 }}
                />
              ) : null}
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
                Mostrando {itens.length} de {total} · página {pagina}
              </Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
