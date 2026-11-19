/**
 * Degradês do Bairro Vivo. Use apenas nos lugares indicados no guia de marca.
 * Ângulos seguem a convenção do CSS (0° = para cima, 90° = para a direita).
 */
export interface GradientSpec {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  angle: number;
}

export const gradients = {
  /** Topo do Login e tela "Resolvida pela comunidade". Combine com o brilho laranja. */
  verdeProfundo: {
    colors: ['#2A8A5A', '#1F7A4D', '#14532D'],
    locations: [0, 0.45, 1],
    angle: 160,
  },
  /** Só o botão Registrar. */
  sinal: {
    colors: ['#CF4D14', '#C2410C', '#9A3412'],
    locations: [0, 0.55, 1],
    angle: 135,
  },
  /** Cartões "Como resolver" e "Quem resolve". */
  brotoCone: {
    colors: ['#DDEFE4', '#E8EEDC', '#FBE3CF'],
    locations: [0, 0.5, 1],
    angle: 120,
  },
  /** Espaço reservado de foto. */
  concreto: {
    colors: ['#DDD5C4', '#B3AA96'],
    angle: 150,
  },
  /** Topo de Explorar e Perfil. */
  fundoLeve: {
    colors: ['#E1EEE4', '#F6F4EE'],
    angle: 180,
  },
} satisfies Record<string, GradientSpec>;

/** Brilho laranja do degradê verde profundo. */
export const brilhoLaranja = { color: 'rgb(234,106,42)', opacity: 0.5 } as const;

/** Converte um ângulo CSS em pontos start/end do expo-linear-gradient. */
export function angleToPoints(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.sin(rad);
  const y = -Math.cos(rad);
  return {
    start: { x: 0.5 - x / 2, y: 0.5 - y / 2 },
    end: { x: 0.5 + x / 2, y: 0.5 + y / 2 },
  };
}
