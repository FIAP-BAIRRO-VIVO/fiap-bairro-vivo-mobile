import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '@/theme';

interface CategoryIconProps {
  /** Chave do ícone da categoria (campo `icone`). */
  icone?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Ícones de traço das categorias, copiados do guia de marca (24 px, linha 1,8).
 * Chaves: buraco, iluminacao, arvore, lixo, vazamento, acessibilidade, pichacao.
 */
export function CategoryIcon({
  icone,
  size = 24,
  color = colors.asfalto,
  strokeWidth = 1.8,
}: CategoryIconProps) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  let shapes;
  switch (icone) {
    case 'buraco':
      shapes = (
        <>
          <Ellipse cx={12} cy={14} rx={9} ry={5} {...p} />
          <Path d="M7 13.5l2.5 1.5 2-2 2.5 2 2.5-1.5" {...p} />
        </>
      );
      break;
    case 'iluminacao':
      shapes = (
        <>
          <Path d="M9 18h6" {...p} />
          <Path d="M10 21h4" {...p} />
          <Path
            d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"
            {...p}
          />
        </>
      );
      break;
    case 'arvore':
      shapes = (
        <>
          <Circle cx={12} cy={9} r={6} {...p} />
          <Path d="M12 15v6" {...p} />
          <Path d="M9 21h6" {...p} />
        </>
      );
      break;
    case 'lixo':
      shapes = (
        <>
          <Path d="M4 7h16" {...p} />
          <Path d="M9 7V4h6v3" {...p} />
          <Path d="M6 7l1 13h10l1-13" {...p} />
        </>
      );
      break;
    case 'vazamento':
      shapes = <Path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" {...p} />;
      break;
    case 'acessibilidade':
      shapes = (
        <>
          <Circle cx={10} cy={4.5} r={1.6} {...p} />
          <Path d="M10 8v5h5l2.5 5.5" {...p} />
          <Path d="M10 10.5h4" {...p} />
          <Path d="M7.5 11.5a5 5 0 1 0 6.5 6.5" {...p} />
        </>
      );
      break;
    case 'pichacao':
      shapes = (
        <>
          <Path d="M8 10h6v11H8z" {...p} />
          <Path d="M9 10V7h4v3" {...p} />
          <Path d="M11 7V5" {...p} />
          <Path d="M16 4h.01M18 6h.01M16 8h.01M20 4h.01M20 8h.01" {...p} />
        </>
      );
      break;
    default:
      shapes = (
        <>
          <Path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" {...p} />
          <Circle cx={12} cy={10} r={2.5} {...p} />
        </>
      );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shapes}
    </Svg>
  );
}

export const ICONES_CATEGORIA = [
  'buraco',
  'iluminacao',
  'arvore',
  'lixo',
  'vazamento',
  'acessibilidade',
  'pichacao',
  'outro',
] as const;
