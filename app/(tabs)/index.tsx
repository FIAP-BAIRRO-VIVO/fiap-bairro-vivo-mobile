import { useRouter } from 'expo-router';
import { LocateFixed, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import {
  Button,
  CategoryIcon,
  CheckMark,
  FilterChip,
  Logo,
  Miniatura,
  OptionSheet,
  StatusChip,
  StickerShadow,
  useToast,
} from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import { useCatalogo } from '@/hooks/useCatalogo';
import { useExigirLogin } from '@/hooks/useExigirLogin';
import { useLocation } from '@/hooks/useLocation';
import type { Ocorrencia, StatusOcorrencia } from '@/models';
import { ocorrenciaService } from '@/services';
import { colors, fonts } from '@/theme';
import { bairroDe, distancia } from '@/utils/format';

type FiltroStatus = 'TODAS' | StatusOcorrencia;

/** Ruas e quadras desenhadas (Mapa.dc.html), esticadas para a tela. */
function RuasIlustradas({ w, h }: { w: number; h: number }) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      <Rect x={0} y={0} width={390} height={844} fill={colors.mapaFundo} />
      <Rect x={210} y={300} width={150} height={120} rx={14} fill={colors.mapaParque} />
      <Rect x={20} y={520} width={90} height={70} rx={12} fill={colors.mapaParque} />
      <Path d="M-20 240 L410 200" stroke="#FFFFFF" strokeWidth={16} />
      <Path d="M-20 470 L410 500" stroke="#FFFFFF" strokeWidth={20} />
      <Path d="M120 -10 L150 860" stroke="#FFFFFF" strokeWidth={14} />
      <Path d="M300 -10 L280 860" stroke="#FFFFFF" strokeWidth={10} />
      <Path d="M-20 360 L190 350" stroke="#FFFFFF" strokeWidth={8} />
      <Path d="M-20 620 L410 640" stroke="#FFFFFF" strokeWidth={8} />
      <Path d="M30 -10 L60 860" stroke="#FFFFFF" strokeWidth={6} />
      <Path d="M200 140 L230 280" stroke="#FFFFFF" strokeWidth={6} />
      <Path d="M-20 120 L410 95" stroke="#FFFFFF" strokeWidth={6} />
      <Path d="M220 640 L240 860" stroke="#FFFFFF" strokeWidth={6} />
    </Svg>
  );
}

interface Limites {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Área dos dados de exemplo, com folga, para normalizar latitude/longitude na tela. */
function calcularLimites(lista: Ocorrencia[]): Limites | null {
  if (lista.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const o of lista) {
    minLat = Math.min(minLat, o.latitude);
    maxLat = Math.max(maxLat, o.latitude);
    minLng = Math.min(minLng, o.longitude);
    maxLng = Math.max(maxLng, o.longitude);
  }
  const spanLat = Math.max(maxLat - minLat, 0.004);
  const spanLng = Math.max(maxLng - minLng, 0.004);
  const cLat = (minLat + maxLat) / 2;
  const cLng = (minLng + maxLng) / 2;
  return {
    minLat: cLat - spanLat * 0.6,
    maxLat: cLat + spanLat * 0.6,
    minLng: cLng - spanLng * 0.6,
    maxLng: cLng + spanLng * 0.6,
  };
}

function Pino({
  o,
  selecionado,
  onPress,
}: {
  o: Ocorrencia;
  selecionado: boolean;
  onPress: () => void;
}) {
  const aberta = o.status === 'ABERTA';
  const tam = selecionado ? 56 : 40;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${o.titulo}. ${aberta ? 'Aberta' : 'Resolvida'}. ${o.categoria.nome}`}
      accessibilityState={{ selected: selecionado }}
      hitSlop={6}
      style={{ alignItems: 'center' }}
    >
      <View
        style={{
          width: tam,
          height: tam,
          borderRadius: tam / 2,
          backgroundColor: aberta ? colors.sinal : colors.verde,
          borderWidth: selecionado ? 4 : 3,
          borderColor: colors.superficie,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: selecionado
            ? `0px 4px 14px ${aberta ? 'rgba(194,65,12,0.45)' : 'rgba(31,122,77,0.45)'}`
            : '0px 2px 6px rgba(28,35,33,0.25)',
        }}
      >
        <View>
          {aberta ? (
            <CategoryIcon
              icone={o.categoria.icone}
              size={selecionado ? 24 : 18}
              color={colors.superficie}
              strokeWidth={2}
            />
          ) : (
            <CheckMark size={selecionado ? 24 : 18} color={colors.superficie} strokeWidth={2.4} />
          )}
        </View>
      </View>
      {selecionado ? (
        <View style={{ width: 4, height: 10, backgroundColor: colors.superficie }} />
      ) : null}
    </Pressable>
  );
}

export default function Mapa() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const exigirLogin = useExigirLogin();
  const local = useLocation();
  const { categorias } = useCatalogo(true);
  const [status, setStatus] = useState<FiltroStatus>('TODAS');
  const [categoriaId, setCategoriaId] = useState('');
  const [verFiltros, setVerFiltros] = useState(false);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [eu, setEu] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tela, setTela] = useState({ w: 390, h: 760 });

  const {
    dados: todas,
    carregando,
    erro,
    recarregar,
  } = useCarregar(() => ocorrenciaService.listarTodas());

  const lista = useMemo(
    () =>
      (todas ?? []).filter(
        (o) =>
          (status === 'TODAS' || o.status === status) &&
          (!categoriaId || o.categoria.id === categoriaId),
      ),
    [todas, status, categoriaId],
  );
  const limites = useMemo(() => calcularLimites(todas ?? []), [todas]);

  // A selecionada some se sair do filtro; senão, destaca a com votação em andamento.
  const selecionada =
    lista.find((o) => o.id === selecionadaId) ??
    lista.find((o) => o.status === 'ABERTA' && o.totalVotosCiclo > 0) ??
    lista[0];

  // Faixa útil do mapa: abaixo do cabeçalho e acima do cartão.
  const topo = insets.top + 140;
  const base = tela.h - 230;
  const posicao = (lat: number, lng: number) => {
    if (!limites) return { x: 0, y: 0 };
    const nx = (lng - limites.minLng) / (limites.maxLng - limites.minLng);
    const ny = (limites.maxLat - lat) / (limites.maxLat - limites.minLat);
    return { x: 28 + nx * (tela.w - 56), y: topo + ny * Math.max(120, base - topo) };
  };

  const minhaLocalizacao = async () => {
    const pos = await local.obter();
    if (!pos) {
      if (local.erro) toast.show(local.erro, 'aviso');
      return;
    }
    setEu(pos);
    if (
      limites &&
      (pos.latitude < limites.minLat ||
        pos.latitude > limites.maxLat ||
        pos.longitude < limites.minLng ||
        pos.longitude > limites.maxLng)
    ) {
      toast.show('Você está fora da área de demonstração (zona leste de SP).', 'info');
    }
  };

  const registrar = () => {
    if (exigirLogin('/ocorrencia/nova')) router.push('/ocorrencia/nova');
  };

  const nomeCategoria = categorias.find((c) => c.id === categoriaId)?.nome;
  const subtitulo = carregando
    ? 'Carregando ocorrências…'
    : erro
      ? 'Não conseguimos carregar'
      : `${lista.length} ${lista.length === 1 ? 'ocorrência' : 'ocorrências'} nesta área${nomeCategoria ? ` · ${nomeCategoria}` : ''}`;

  const pe = eu ? posicao(eu.latitude, eu.longitude) : null;
  const euVisivel = pe && pe.x > 0 && pe.x < tela.w && pe.y > topo - 20 && pe.y < base + 20;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.mapaFundo, overflow: 'hidden' }}
      onLayout={(e: LayoutChangeEvent) =>
        setTela({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      <RuasIlustradas w={tela.w} h={tela.h} />

      {lista
        .filter((o) => o.id !== selecionada?.id)
        .map((o) => {
          const p = posicao(o.latitude, o.longitude);
          return (
            <View key={o.id} style={{ position: 'absolute', left: p.x - 20, top: p.y - 20 }}>
              <Pino o={o} selecionado={false} onPress={() => setSelecionadaId(o.id)} />
            </View>
          );
        })}
      {selecionada ? (
        <View
          style={{
            position: 'absolute',
            left: posicao(selecionada.latitude, selecionada.longitude).x - 28,
            top: posicao(selecionada.latitude, selecionada.longitude).y - 56,
            zIndex: 2,
          }}
        >
          <Pino
            o={selecionada}
            selecionado
            onPress={() => router.push(`/ocorrencia/${selecionada.id}`)}
          />
        </View>
      ) : null}
      {euVisivel && pe ? (
        <View
          accessibilityLabel="Você está aqui"
          style={{
            position: 'absolute',
            left: pe.x - 11,
            top: pe.y - 11,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#2563EB',
            borderWidth: 4,
            borderColor: colors.superficie,
            boxShadow: '0px 0px 0px 8px rgba(37,99,235,0.18)',
          }}
        />
      ) : null}

      {/* Cabeçalho flutuante */}
      <View style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 16, gap: 10 }}>
        <View
          style={{
            height: 56,
            backgroundColor: colors.superficie,
            borderRadius: 16,
            boxShadow: '0px 2px 10px rgba(28,35,33,0.12)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 14,
            paddingRight: 8,
          }}
        >
          <Logo size={36} />
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: fonts.tituloForte,
                fontSize: 18,
                letterSpacing: -0.18,
                color: colors.asfalto,
              }}
            >
              bairro vivo<Text style={{ color: colors.sinal }}>.</Text>
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
              {subtitulo}
            </Text>
          </View>
          <Pressable
            onPress={() => setVerFiltros(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: categoriaId ? colors.broto : colors.calcada,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={20} color={colors.asfalto} strokeWidth={1.8} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterChip
            look="floating"
            label="Todas"
            selected={status === 'TODAS'}
            onPress={() => setStatus('TODAS')}
          />
          <FilterChip
            look="floating"
            label="Abertas"
            dot={colors.sinal}
            selected={status === 'ABERTA'}
            onPress={() => setStatus('ABERTA')}
          />
          <FilterChip
            look="floating"
            label="Resolvidas"
            dot={colors.verde}
            selected={status === 'RESOLVIDA'}
            onPress={() => setStatus('RESOLVIDA')}
          />
        </View>
      </View>

      <Pressable
        onPress={minhaLocalizacao}
        accessibilityRole="button"
        accessibilityLabel="Minha localização"
        style={{
          position: 'absolute',
          right: 16,
          top: Math.max(insets.top + 150, tela.h * 0.47),
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.superficie,
          boxShadow: '0px 2px 10px rgba(28,35,33,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {local.buscando ? (
          <ActivityIndicator color={colors.verde} />
        ) : (
          <LocateFixed size={22} color={colors.verde} strokeWidth={2} />
        )}
      </Pressable>

      {carregando ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: tela.h / 2 - 20,
            alignItems: 'center',
          }}
        >
          <ActivityIndicator color={colors.verde} size="large" />
        </View>
      ) : null}

      {/* Cartão da ocorrência selecionada, erro ou vazio */}
      <View style={{ position: 'absolute', left: 12, right: 16, bottom: 76 }}>
        {erro ? (
          <View
            style={{ backgroundColor: colors.superficie, borderRadius: 20, padding: 16, gap: 10 }}
          >
            <Text style={{ fontFamily: fonts.titulo, fontSize: 17, color: colors.asfalto }}>
              Não conseguimos conectar
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.concreto }}>
              {erro.mensagem}
            </Text>
            <Button title="Tentar de novo" height={44} onPress={recarregar} />
          </View>
        ) : !carregando && !selecionada ? (
          <View
            style={{
              backgroundColor: colors.superficie,
              borderRadius: 20,
              padding: 16,
              gap: 4,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.titulo, fontSize: 17, color: colors.asfalto }}>
              Nenhuma ocorrência nesta área
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: colors.concreto,
                textAlign: 'center',
              }}
            >
              Viu algum problema por aqui? Seja o primeiro a registrar.
            </Text>
          </View>
        ) : selecionada ? (
          <StickerShadow offset={4} radius={20}>
            <Pressable
              onPress={() => router.push(`/ocorrencia/${selecionada.id}`)}
              accessibilityRole="link"
              accessibilityLabel={`Abrir ${selecionada.titulo}`}
              style={{
                backgroundColor: colors.superficie,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: colors.asfalto,
                padding: 16,
                flexDirection: 'row',
                gap: 14,
              }}
            >
              <Miniatura o={selecionada} size={64} radius={14} />
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <StatusChip status={selecionada.status} />
                  <Text
                    numberOfLines={1}
                    style={{
                      flexShrink: 1,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                      color: colors.concreto,
                    }}
                  >
                    {selecionada.categoria.nome} ·{' '}
                    {eu
                      ? distancia(
                          eu.latitude,
                          eu.longitude,
                          selecionada.latitude,
                          selecionada.longitude,
                        )
                      : bairroDe(selecionada)}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: fonts.titulo,
                    fontSize: 17,
                    lineHeight: 20,
                    color: colors.asfalto,
                  }}
                >
                  {selecionada.titulo}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
                  {selecionada.totalVotosCiclo} de 2 confirmações para{' '}
                  {selecionada.status === 'ABERTA' ? 'resolver' : 'reabrir'}
                </Text>
              </View>
            </Pressable>
          </StickerShadow>
        ) : null}
      </View>

      <Button
        title="Registrar"
        variant="register"
        radius={16}
        icon={<Plus size={20} color="#fff" strokeWidth={2.2} />}
        onPress={registrar}
        accessibilityLabel="Registrar nova ocorrência"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
      />

      <OptionSheet
        visible={verFiltros}
        title="Filtrar por categoria"
        value={categoriaId}
        onSelect={setCategoriaId}
        onClose={() => setVerFiltros(false)}
        options={[
          { value: '', label: 'Todas as categorias' },
          ...categorias.map((c) => ({ value: c.id, label: c.nome })),
        ]}
      />
    </View>
  );
}
