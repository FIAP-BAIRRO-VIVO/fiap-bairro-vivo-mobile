/** Paleta oficial do Bairro Vivo (design-referencia/Main.dc.html). */
export const colors = {
  verde: '#1F7A4D',
  verdeEscuro: '#14532D',
  broto: '#DDEFE4',
  sinal: '#C2410C',
  sinalEscuro: '#9A3412',
  sinalClaro: '#FDE7D6',
  sinalSuave: '#FDBA74',
  asfalto: '#1C2321',
  concreto: '#5B6560',
  calcada: '#F6F4EE',
  superficie: '#FFFFFF',
  linha: '#E2DED3',
  /** Tons auxiliares usados nos mockups (fundos neutros, mapa e switches). */
  areia: '#ECE8DD',
  mapaFundo: '#E9E5DA',
  mapaParque: '#D3E6D8',
  switchOff: '#D6D2C6',
  textoSobreEscuro: '#D6D3CB',
} as const;

export type ColorToken = keyof typeof colors;
