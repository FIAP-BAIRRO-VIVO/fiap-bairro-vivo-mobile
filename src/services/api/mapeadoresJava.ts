/**
 * Conversão entre os DTOs da API Java (Spring Boot) e os modelos do app.
 * Funções puras, cobertas por testes.
 */
import type { ErroServico, OrientacaoCidada, Perfil, StatusErro } from '@/models';

/* ---------- DTOs observados na API publicada ---------- */

export interface UsuarioJavaDto {
  id: string;
  nome: string;
  email: string;
  /** A API devolve "papel" (o contrato sugeria "papeis"). */
  papel?: string;
  papeis?: string[];
}

export interface AuthRespostaJavaDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UsuarioJavaDto;
}

/** Página do Spring (formato da API: conteudo/pagina/tamanho/totalElementos/totalPaginas). */
export interface PaginaJavaDto<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface OrientacaoJavaDto {
  id: string | number;
  ocorrenciaId: string | number;
  estado: string;
  orgaoResponsavel?: string | null;
  servico?: string | null;
  canais?: { tipo: string; valor: string; horario?: string | null }[] | null;
  passos?: string[] | null;
  cuidados?: string[] | null;
  fontes?: { titulo: string; url: string; verificadaEm?: string | null }[] | null;
  geradaEm?: string | null;
}

export interface ErroJava extends ErroServico {
  codigo?: string;
}

/* ---------- Conversões ---------- */

export function perfilDaJava(u: UsuarioJavaDto): Perfil {
  const papeis = [u.papel, ...(u.papeis ?? [])].filter(Boolean).map((p) => String(p).toUpperCase());
  return papeis.some((p) => p.includes('ADMIN')) ? 'ADMIN' : 'CIDADAO';
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Decodifica base64url (ASCII) sem depender de atob/Buffer (funciona no web e no celular). */
export function base64UrlParaTexto(entrada: string): string {
  let bits = 0;
  let valor = 0;
  let saida = '';
  for (const ch of entrada.replace(/=+$/, '')) {
    const i = ALFABETO.indexOf(ch === '+' ? '-' : ch === '/' ? '_' : ch);
    if (i < 0) continue;
    valor = (valor << 6) | i;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      saida += String.fromCharCode((valor >> bits) & 0xff);
    }
  }
  return saida;
}

/** Lê o "exp" do JWT (sem validar a assinatura; quem valida é o servidor). */
export function expiracaoDoJwt(token: string, padraoSegundos = 3600, agora = Date.now()): string {
  try {
    const json = JSON.parse(base64UrlParaTexto(token.split('.')[1])) as { exp?: number };
    if (json.exp) return new Date(json.exp * 1000).toISOString();
  } catch {
    // Token fora do padrão: usa o expiresIn.
  }
  return new Date(agora + padraoSegundos * 1000).toISOString();
}

const ESTADOS: OrientacaoCidada['estado'][] = [
  'DISPONIVEL',
  'PARCIAL',
  'SEM_FONTE',
  'LOCALIDADE_NAO_CONFIRMADA',
  'ERRO',
];

export function orientacaoDaJava(o: OrientacaoJavaDto): OrientacaoCidada {
  const estado = String(o.estado ?? '').toUpperCase() as OrientacaoCidada['estado'];
  const tipos = ['TELEFONE', 'SITE', 'PRESENCIAL', 'OUTRO'] as const;
  return {
    id: String(o.id),
    ocorrenciaId: String(o.ocorrenciaId),
    estado: ESTADOS.includes(estado) ? estado : 'ERRO',
    orgaoResponsavel: o.orgaoResponsavel ?? undefined,
    servico: o.servico ?? undefined,
    canais: (o.canais ?? []).map((c) => ({
      tipo: (tipos as readonly string[]).includes(c.tipo)
        ? (c.tipo as (typeof tipos)[number])
        : 'OUTRO',
      valor: c.valor,
      horario: c.horario ?? undefined,
    })),
    passos: o.passos ?? [],
    cuidados: o.cuidados ?? [],
    // Sem URL não há fonte: nunca mostrar fonte inventada.
    fontes: (o.fontes ?? [])
      .filter((f) => /^https?:\/\//.test(f.url ?? ''))
      .map((f) => ({ titulo: f.titulo, url: f.url, verificadaEm: f.verificadaEm ?? undefined })),
    geradaEm: o.geradaEm ?? new Date().toISOString(),
    origem: 'IA_JAVA',
  };
}

/* ---------- Erros ---------- */

const CAMPOS: Record<string, string> = {
  nome: 'nome',
  email: 'email',
  senha: 'senha',
  confirmacaosenha: 'confirmacaoSenha',
  ocorrenciaid: 'ocorrenciaId',
};

/** Mensagens do Bean Validation em inglês → português. */
function traduzir(msg: string): string {
  if (/must not be blank|must not be null|must not be empty/i.test(msg))
    return 'Preencha este campo.';
  if (/well-formed email/i.test(msg)) return 'Digite um email válido, como nome@dominio.com';
  const tamanho = msg.match(/size must be between (\d+) and (\d+)/i);
  if (tamanho) return `Use entre ${tamanho[1]} e ${tamanho[2]} caracteres.`;
  return msg;
}

const MENSAGEM_PADRAO: Record<number, string> = {
  400: 'Confira os campos destacados.',
  401: 'Email ou senha não conferem.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos o que você procura.',
  409: 'Já existe uma conta com este email.',
  429: 'Muitas ações seguidas. Espere um minuto e tente de novo.',
  500: 'A API Java não conseguiu concluir agora. Tente de novo em instantes.',
};

export function erroDaJava(httpStatus: number, corpo: unknown): ErroJava {
  const s = ([400, 401, 403, 404, 409, 429].includes(httpStatus) ? httpStatus : 500) as StatusErro;
  const c = (corpo ?? {}) as {
    codigo?: string;
    mensagem?: string;
    detalhes?: { campo?: string; mensagem?: string }[];
  };
  let campos: Record<string, string> | undefined;
  if (c.detalhes?.length) {
    campos = {};
    for (const d of c.detalhes) {
      if (!d.campo || !d.mensagem) continue;
      const campo = CAMPOS[d.campo.toLowerCase()] ?? d.campo;
      if (!campos[campo]) campos[campo] = traduzir(d.mensagem);
    }
  }
  const traduzidas: Record<string, string> = {
    CREDENCIAIS_INVALIDAS: 'Email ou senha não conferem.',
    EMAIL_JA_CADASTRADO: 'Este email já tem conta. Tente entrar.',
    VALIDACAO_INVALIDA: 'Confira os campos destacados.',
    NAO_AUTENTICADO: 'Sua sessão expirou. Entre de novo para continuar.',
  };
  const mensagem =
    s === 500
      ? MENSAGEM_PADRAO[500]
      : ((c.codigo && traduzidas[c.codigo]) ?? c.mensagem ?? MENSAGEM_PADRAO[s]);
  if (c.codigo === 'EMAIL_JA_CADASTRADO')
    campos = { ...campos, email: traduzidas.EMAIL_JA_CADASTRADO };
  return { status: s, mensagem, campos, codigo: c.codigo };
}
