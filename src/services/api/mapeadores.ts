/**
 * Conversão entre os DTOs da API .NET e os modelos do app.
 * Funções puras (sem rede nem armazenamento), cobertas por testes.
 */
import type {
  Atualizacao,
  Categoria,
  ErroServico,
  HistoricoStatus,
  Midia,
  Municipio,
  Ocorrencia,
  RelatorioLinha,
  StatusErro,
  StatusOcorrencia,
  TipoAtualizacao,
} from '@/models';

/* ---------- DTOs da API (swagger v1) ---------- */

export interface CategoriaDto {
  id: string;
  nome: string;
  descricao?: string | null;
  icone?: string | null;
  ativa: boolean;
}

export interface MunicipioDto {
  id: string;
  codigoIbge?: number | null;
  nome: string;
  uf: string;
}

export interface MidiaDto {
  id: string;
  urlExibicao?: string | null;
  mimeType?: string | null;
  dtCriacao?: string;
}

export interface OcorrenciaDto {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  numeroCiclo: number;
  categoria: CategoriaDto;
  municipio: MunicipioDto;
  latitude: number;
  longitude: number;
  enderecoReferencia?: string | null;
  autorExibicao?: string | null;
  anonimoPublico: boolean;
  dtCriacao: string;
  dtAtualizacao: string;
  midias?: MidiaDto[] | null;
  totalVotosCiclo: number;
}

export interface AtualizacaoDto {
  id: string;
  idOcorrencia: string;
  tipo: string;
  texto?: string | null;
  autorExibicao?: string | null;
  anonimoPublico: boolean;
  contabilizadaComoVoto: boolean;
  statusAtual: string;
  numeroCiclo: number;
  confirmacoesNoCiclo?: number;
  dtCriacao: string;
  midias?: MidiaDto[] | null;
}

export interface HistoricoDto {
  id: string;
  idOcorrencia: string;
  operacao?: string;
  statusAnterior?: string | null;
  statusNovo: string;
  cicloAnterior?: number | null;
  cicloNovo: number;
  dtEvento: string;
}

export interface PaginaDto<T> {
  pagina: number;
  tamanho: number;
  total: number;
  dados: T[];
}

/* ---------- Datas ---------- */

/**
 * O Oracle devolve datas sem fuso, no horário de Brasília (ex.: "2026-11-18T14:11:27").
 * Datas com "Z" ou offset são mantidas. Ver também o caso de dtCriacao gravado em UTC.
 */
export function normalizarData(valor: string | null | undefined, agora = Date.now()): string {
  if (!valor) return new Date(0).toISOString();
  const temFuso = /([zZ]|[+-]\d{2}:?\d{2})$/.test(valor);
  if (temFuso) {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toISOString();
  }
  // Corta frações de segundo além de milissegundos (o Oracle manda microssegundos).
  const base = valor.replace(/(\.\d{3})\d+$/, '$1');
  const brasilia = new Date(`${base}-03:00`);
  if (Number.isNaN(brasilia.getTime())) return valor;
  // A API grava dtCriacao da ocorrência em UTC (também sem fuso). Se a leitura em
  // horário de Brasília cair no futuro, a data na verdade era UTC.
  if (brasilia.getTime() > agora + 60_000) return new Date(`${base}Z`).toISOString();
  return brasilia.toISOString();
}

/* ---------- Ícones e textos ---------- */

/** Ícones da API (nomes do lucide) → chaves de ícone do app. */
const ICONE_API_PARA_APP: Record<string, string> = {
  construction: 'buraco',
  lightbulb: 'iluminacao',
  trees: 'arvore',
  tree: 'arvore',
  'trash-2': 'lixo',
  trash: 'lixo',
  droplets: 'vazamento',
  droplet: 'vazamento',
  accessibility: 'acessibilidade',
  'spray-can': 'pichacao',
};

export function iconeDoApp(icone?: string | null): string | undefined {
  if (!icone) return undefined;
  return ICONE_API_PARA_APP[icone] ?? icone;
}

/** Caminho inverso, para manter o padrão da API ao criar/editar categorias. */
export function iconeDaApi(icone?: string): string | undefined {
  if (!icone) return undefined;
  const achado = Object.entries(ICONE_API_PARA_APP).find(([, app]) => app === icone);
  return achado ? achado[0] : icone;
}

/** A API devolve "Cidadao anonimo" sem acento. */
export function autorDoApp(autor?: string | null, anonimo?: boolean): string {
  if (anonimo || !autor || /^cidad[aã]o an[oô]nimo$/i.test(autor.trim())) return 'Cidadão anônimo';
  return autor;
}

function status(s: string): StatusOcorrencia {
  return s?.toUpperCase() === 'RESOLVIDA' ? 'RESOLVIDA' : 'ABERTA';
}

function tipo(t: string): TipoAtualizacao {
  const v = t?.toUpperCase();
  return v === 'RESOLVIDO' || v === 'PERSISTE' ? v : 'COMENTARIO';
}

/* ---------- Entidades ---------- */

export function categoriaDoApp(c: CategoriaDto): Categoria {
  return {
    id: String(c.id),
    nome: c.nome,
    descricao: c.descricao ?? undefined,
    icone: iconeDoApp(c.icone),
    ativa: c.ativa,
  };
}

export function municipioDoApp(m: MunicipioDto): Municipio {
  return { id: String(m.id), codigoIbge: m.codigoIbge ?? undefined, nome: m.nome, uf: m.uf };
}

export function midiasDoApp(midias?: MidiaDto[] | null): Midia[] {
  return (midias ?? [])
    .filter((m) => !!m.urlExibicao)
    .map((m, i) => ({
      id: String(m.id),
      urlExibicao: m.urlExibicao as string,
      mimeType: m.mimeType ?? 'image/jpeg',
      principal: i === 0,
    }));
}

/** `idAutor` não vem na resposta pública: quem chama informa (via /minhas). */
export function ocorrenciaDoApp(o: OcorrenciaDto, idAutor = ''): Ocorrencia {
  return {
    id: String(o.id),
    titulo: o.titulo,
    descricao: o.descricao,
    status: status(o.status),
    numeroCiclo: o.numeroCiclo,
    categoria: categoriaDoApp(o.categoria),
    municipio: municipioDoApp(o.municipio),
    latitude: o.latitude,
    longitude: o.longitude,
    enderecoReferencia: o.enderecoReferencia ?? undefined,
    idAutor,
    autorExibicao: autorDoApp(o.autorExibicao, o.anonimoPublico),
    anonimoPublico: o.anonimoPublico,
    dtCriacao: normalizarData(o.dtCriacao),
    dtAtualizacao: normalizarData(o.dtAtualizacao),
    midias: midiasDoApp(o.midias),
    totalVotosCiclo: o.totalVotosCiclo ?? 0,
    excluida: false,
  };
}

export function atualizacaoDoApp(a: AtualizacaoDto, idAutor = ''): Atualizacao {
  const foto = midiasDoApp(a.midias)[0];
  return {
    id: String(a.id),
    idOcorrencia: String(a.idOcorrencia),
    tipo: tipo(a.tipo),
    texto: a.texto ?? undefined,
    idAutor,
    autorExibicao: autorDoApp(a.autorExibicao, a.anonimoPublico),
    anonimoPublico: a.anonimoPublico,
    contabilizadaComoVoto: a.contabilizadaComoVoto,
    statusAtual: status(a.statusAtual),
    numeroCiclo: a.numeroCiclo,
    dtCriacao: normalizarData(a.dtCriacao),
    urlFotoEvidencia: foto?.urlExibicao,
  };
}

/** Só as mudanças de status (a criação vem como INSERT sem status anterior). */
export function historicoDoApp(lista: HistoricoDto[]): HistoricoStatus[] {
  return lista
    .filter((h) => !!h.statusAnterior && h.statusAnterior !== h.statusNovo)
    .map((h) => ({
      id: String(h.id),
      idOcorrencia: String(h.idOcorrencia),
      statusAnterior: status(h.statusAnterior as string),
      statusNovo: status(h.statusNovo),
      cicloAnterior: h.cicloAnterior ?? undefined,
      cicloNovo: h.cicloNovo,
      dtEvento: normalizarData(h.dtEvento),
    }))
    .sort((a, b) => a.dtEvento.localeCompare(b.dtEvento));
}

export function relatorioDoApp(l: RelatorioLinha): RelatorioLinha {
  return {
    ...l,
    idMunicipio: String(l.idMunicipio),
    idCategoria: String(l.idCategoria),
    status: status(l.status),
  };
}

/* ---------- Erros ---------- */

/** Campos do ModelState da API → campos dos formulários do app. */
const CAMPOS: Record<string, string> = {
  titulo: 'titulo',
  descricao: 'descricao',
  categoriaid: 'idCategoria',
  municipioid: 'idMunicipio',
  latitude: 'local',
  longitude: 'local',
  enderecoreferencia: 'enderecoReferencia',
  texto: 'texto',
  tipo: 'tipo',
  nome: 'nome',
};

const MENSAGEM_PADRAO: Record<number, string> = {
  400: 'Confira os campos destacados.',
  401: 'Sua sessão expirou. Entre de novo para continuar.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Registro indisponível. Esta ocorrência pode ter sido excluída por quem registrou.',
  409: 'Esta ação entra em conflito com a situação atual.',
  429: 'Muitas ações seguidas. Espere um minuto e tente de novo.',
  500: 'Não conseguimos conectar. Tente de novo em instantes.',
};

/** Converte a resposta de erro da API ({ mensagem, erros? }) no formato do app. */
export function erroDaApi(httpStatus: number, corpo: unknown): ErroServico {
  const s: StatusErro = (
    [400, 401, 403, 404, 409, 429].includes(httpStatus) ? httpStatus : 500
  ) as StatusErro;
  const c = (corpo ?? {}) as {
    mensagem?: string;
    title?: string;
    erros?: Record<string, string[]>;
    errors?: Record<string, string[]>;
  };
  const brutos = c.erros ?? c.errors;
  let campos: Record<string, string> | undefined;
  if (brutos) {
    campos = {};
    for (const [chave, msgs] of Object.entries(brutos)) {
      const limpa = chave
        .replace(/^\$\.?/, '')
        .replace(/^dto\./i, '')
        .toLowerCase();
      const campo = CAMPOS[limpa] ?? limpa;
      if (msgs?.[0] && !campos[campo]) campos[campo] = msgs[0];
    }
  }
  const mensagem =
    s === 500
      ? MENSAGEM_PADRAO[500]
      : (c.mensagem ?? (s === 400 ? undefined : c.title) ?? MENSAGEM_PADRAO[s]);
  return { status: s, mensagem: mensagem ?? MENSAGEM_PADRAO[s], campos };
}
