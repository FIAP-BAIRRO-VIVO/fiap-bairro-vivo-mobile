import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors, fonts } from '@/theme';

/** Metros por pixel do mini mapa ilustrado. */
const METROS_POR_PX = 2.2;
const GRAUS_LAT_POR_M = 1 / 111_320;

const TILE_W = 390;
const TILE_H = 150;

/** Quarteirões e ruas de um "ladrilho" que se repete enquanto o mapa é arrastado. */
function Ladrilho({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-10 60 L400 50" stroke="#FFFFFF" strokeWidth={14} />
      <Path d="M140 -10 L160 160" stroke="#FFFFFF" strokeWidth={10} />
      <Path d="M-10 120 L400 130" stroke="#FFFFFF" strokeWidth={6} />
      <Path d="M300 -10 L290 160" stroke="#FFFFFF" strokeWidth={6} />
      <Rect x={230} y={70} width={90} height={45} rx={8} fill={colors.mapaParque} />
    </G>
  );
}

export function PinoMapa({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size * (40 / 34)} viewBox="0 0 48 48">
      <Path d="M24 45s15-13 15-25A15 15 0 0 0 9 20c0 12 15 25 15 25z" fill={colors.sinal} />
      <Circle cx={24} cy={20} r={5} fill="#FFFFFF" />
    </Svg>
  );
}

interface MiniMapaProps {
  latitude: number;
  longitude: number;
  /** false enquanto a pessoa ainda não confirmou o local. */
  definido: boolean;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  dica?: string;
  dicaLado?: 'esquerda' | 'direita';
  erro?: boolean;
}

/**
 * Mini mapa ilustrado (sem tiles externos, funciona no web). O pino fica no centro;
 * arrastar o mapa move as coordenadas. Um toque também confirma o local.
 */
export function MiniMapa({
  latitude,
  longitude,
  definido,
  onChange,
  height = 150,
  dica = 'Arraste o mapa para ajustar o pino',
  dicaLado = 'esquerda',
  erro = false,
}: MiniMapaProps) {
  const [largura, setLargura] = useState(TILE_W);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const inicio = useRef({ lat: latitude, lng: longitude, ox: 0, oy: 0 });
  const atual = useRef({ lat: latitude, lng: longitude });
  const offsetRef = useRef(offset);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    atual.current = { lat: latitude, lng: longitude };
    offsetRef.current = offset;
    onChangeRef.current = onChange;
  });

  // Os refs só são lidos dentro dos callbacks de gesto, nunca durante o render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        inicio.current = {
          lat: atual.current.lat,
          lng: atual.current.lng,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
      },
      onPanResponderMove: (_e, g) => {
        setOffset({ x: inicio.current.ox + g.dx, y: inicio.current.oy + g.dy });
        const dLat = g.dy * METROS_POR_PX * GRAUS_LAT_POR_M;
        const cos = Math.cos((inicio.current.lat * Math.PI) / 180) || 1;
        const dLng = (-g.dx * METROS_POR_PX * GRAUS_LAT_POR_M) / cos;
        onChangeRef.current(inicio.current.lat + dLat, inicio.current.lng + dLng);
      },
      onPanResponderRelease: (_e, g) => {
        if (Math.abs(g.dx) < 3 && Math.abs(g.dy) < 3) {
          onChangeRef.current(inicio.current.lat, inicio.current.lng);
        }
      },
    }),
  );

  const ox = ((offset.x % TILE_W) + TILE_W) % TILE_W;
  const oy = ((offset.y % TILE_H) + TILE_H) % TILE_H;
  const tiles = [];
  for (let i = -1; i <= Math.ceil(largura / TILE_W); i++) {
    for (let j = -1; j <= 1; j++) {
      tiles.push(<Ladrilho key={`${i}:${j}`} x={i * TILE_W + ox} y={j * TILE_H + oy} />);
    }
  }

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
      accessibilityLabel={`Mapa do local. ${definido ? `Pino em ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Local ainda não marcado'}`}
      accessibilityHint="Arraste para mover o mapa sob o pino"
      style={{
        height,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: erro ? colors.sinal : colors.linha,
        backgroundColor: colors.mapaFundo,
        cursor: 'pointer',
      }}
      {...responder.panHandlers}
    >
      <Svg width="100%" height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Rect x={0} y={0} width="100%" height={height} fill={colors.mapaFundo} />
        {tiles}
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: height / 2 - 34,
          marginLeft: -17,
          opacity: definido ? 1 : 0.55,
          pointerEvents: 'none',
        }}
      >
        <PinoMapa />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          ...(dicaLado === 'esquerda' ? { left: 10 } : { right: 10 }),
          backgroundColor: 'rgba(255,255,255,0.92)',
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      >
        <Text style={{ fontFamily: fonts.semi, fontSize: 12, color: colors.asfalto }}>{dica}</Text>
      </View>
    </View>
  );
}
