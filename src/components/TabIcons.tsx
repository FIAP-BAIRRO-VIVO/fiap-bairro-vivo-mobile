import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type TabIconName = 'mapa' | 'explorar' | 'minhas' | 'perfil' | 'relatorios' | 'categorias';

/** Ícones da barra de abas, copiados dos mockups (22 px). */
export function TabIcon({
  name,
  focused,
  size = 22,
}: {
  name: TabIconName;
  focused: boolean;
  size?: number;
}) {
  const p = {
    stroke: focused ? colors.verde : colors.concreto,
    strokeWidth: focused ? 2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  let shapes;
  switch (name) {
    case 'mapa':
      shapes = (
        <>
          <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" {...p} />
          <Path d="M9 4v14" {...p} />
          <Path d="M15 6v14" {...p} />
        </>
      );
      break;
    case 'explorar':
      shapes = (
        <>
          <Rect x={4} y={4} width={16} height={6} rx={2} {...p} />
          <Rect x={4} y={14} width={16} height={6} rx={2} {...p} />
        </>
      );
      break;
    case 'minhas':
      shapes = (
        <>
          <Path d="M8 6h12" {...p} />
          <Path d="M8 12h12" {...p} />
          <Path d="M8 18h12" {...p} />
          <Circle cx={4} cy={6} r={1} {...p} />
          <Circle cx={4} cy={12} r={1} {...p} />
          <Circle cx={4} cy={18} r={1} {...p} />
        </>
      );
      break;
    case 'perfil':
      shapes = (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...p} />
        </>
      );
      break;
    case 'relatorios':
      shapes = (
        <>
          <Path d="M4 20V10" {...p} />
          <Path d="M10 20V4" {...p} />
          <Path d="M16 20v-7" {...p} />
          <Path d="M22 20H2" {...p} />
        </>
      );
      break;
    case 'categorias':
      shapes = (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={2} {...p} />
          <Rect x={13} y={4} width={7} height={7} rx={2} {...p} />
          <Rect x={4} y={13} width={7} height={7} rx={2} {...p} />
          <Rect x={13} y={13} width={7} height={7} rx={2} {...p} />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shapes}
    </Svg>
  );
}
