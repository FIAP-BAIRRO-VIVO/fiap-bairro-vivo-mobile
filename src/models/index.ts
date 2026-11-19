/**
 * Modelos do Bairro Vivo. Os nomes dos campos espelham o contrato da API .NET
 * para que a troca da fonte local pela API seja direta.
 */

export type Perfil = 'CIDADAO' | 'ADMIN';
export type StatusOcorrencia = 'ABERTA' | 'RESOLVIDA';
export type TipoAtualizacao = 'COMENTARIO' | 'PERSISTE' | 'RESOLVIDO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  senhaHash: string;
  ativo: boolean;
}

/** Dados públicos da conta (sem o hash da senha). */
export type UsuarioPublico = Omit<Usuario, 'senhaHash'>;

// STANDBY: formato final do JWT virá do Java
export interface Sessao {
  token: string;
  tipo: 'Bearer';
  idUsuario: string;
  perfil: Perfil;
  nome: string;
  email: string;
  expiraEm: string;
  /**
   * Quem emitiu o JWT. "JAVA" é o login oficial; "TESTE_DOTNET" é o gerador de token
   * de teste da API .NET, usado só quando o Java não autentica a conta de teste.
   */
  emissor?: 'JAVA' | 'TESTE_DOTNET' | 'LOCAL';
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  ativa: boolean;
}

export interface Municipio {
  id: string;
  codigoIbge?: number;
  nome: string;
  uf: string;
}

export interface Midia {
  id: string;
  urlExibicao: string;
  mimeType: string;
  principal: boolean;
}

export interface Ocorrencia {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusOcorrencia;
  numeroCiclo: number;
  categoria: Categoria;
  municipio: Municipio;
  latitude: number;
  longitude: number;
  enderecoReferencia?: string;
  idAutor: string;
  autorExibicao: string;
  anonimoPublico: boolean;
  dtCriacao: string;
  dtAtualizacao: string;
  midias: Midia[];
  totalVotosCiclo: number;
  excluida: boolean;
}

export interface Atualizacao {
  id: string;
  idOcorrencia: string;
  tipo: TipoAtualizacao;
  texto?: string;
  idAutor: string;
  autorExibicao: string;
  anonimoPublico: boolean;
  contabilizadaComoVoto: boolean;
  statusAtual: StatusOcorrencia;
  numeroCiclo: number;
  dtCriacao: string;
  urlFotoEvidencia?: string;
}

export interface HistoricoStatus {
  id: string;
  idOcorrencia: string;
  statusAnterior?: StatusOcorrencia;
  statusNovo: StatusOcorrencia;
  cicloAnterior?: number;
  cicloNovo: number;
  dtEvento: string;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  total: number;
}

export interface RelatorioLinha {
  idMunicipio: string;
  nomeMunicipio: string;
  uf: string;
  idCategoria: string;
  nomeCategoria: string;
  status: StatusOcorrencia;
  totalOcorrencias: number;
}

// STANDBY: virá da API Java (Spring AI + RAG)
export interface OrientacaoCidada {
  id: string;
  ocorrenciaId: string;
  estado: 'DISPONIVEL' | 'PARCIAL' | 'SEM_FONTE' | 'LOCALIDADE_NAO_CONFIRMADA' | 'ERRO';
  orgaoResponsavel?: string;
  servico?: string;
  canais: { tipo: 'TELEFONE' | 'SITE' | 'PRESENCIAL' | 'OUTRO'; valor: string; horario?: string }[];
  passos: string[];
  cuidados: string[];
  fontes: { titulo: string; url: string; verificadaEm?: string }[];
  geradaEm: string;
  /** De onde veio a resposta: IA da API Java ou base local de demonstração. */
  origem?: 'IA_JAVA' | 'BASE_LOCAL';
}

/* ---------- Entradas dos serviços ---------- */

export interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

export interface LoginInput {
  email: string;
  senha: string;
}

/** Foto escolhida no formulário (uri local ou data URI no web). */
export interface FotoInput {
  uri: string;
  mimeType?: string;
}

export interface OcorrenciaInput {
  titulo: string;
  descricao: string;
  idCategoria: string;
  idMunicipio: string;
  latitude: number | null;
  longitude: number | null;
  enderecoReferencia?: string;
  anonimoPublico: boolean;
  fotos: FotoInput[];
}

export interface AtualizacaoInput {
  tipo: TipoAtualizacao;
  texto?: string;
  anonimoPublico: boolean;
  foto?: FotoInput;
}

export type OrdemOcorrencias = 'RECENTES' | 'ANTIGAS' | 'MAIS_VOTADAS';

export interface FiltroOcorrencias {
  pagina?: number;
  tamanho?: number;
  categoriaId?: string;
  municipioId?: string;
  status?: StatusOcorrencia;
  ordem?: OrdemOcorrencias;
}

export interface FiltroRelatorio {
  municipioId?: string;
  categoriaId?: string;
  status?: StatusOcorrencia;
}

export interface CategoriaInput {
  nome: string;
  descricao?: string;
  icone?: string;
  ativa: boolean;
}

/** Resultado de enviar uma atualização. */
export interface ResultadoAtualizacao {
  atualizacao: Atualizacao;
  ocorrencia: Ocorrencia;
  /** Preenchido quando esta atualização mudou o status (2ª confirmação). */
  historico?: HistoricoStatus;
}

/* ---------- Erros ---------- */

export type StatusErro = 400 | 401 | 403 | 404 | 409 | 429 | 500;

/** Formato único de erro dos serviços (local e API). */
export interface ErroServico {
  status: StatusErro;
  mensagem: string;
  /** Erros por campo nos casos 400. */
  campos?: Record<string, string>;
}
