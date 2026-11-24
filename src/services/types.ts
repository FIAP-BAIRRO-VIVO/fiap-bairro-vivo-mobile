import type {
  Atualizacao,
  AtualizacaoInput,
  CadastroInput,
  Categoria,
  CategoriaInput,
  FiltroOcorrencias,
  FiltroRelatorio,
  HistoricoStatus,
  LoginInput,
  Municipio,
  Ocorrencia,
  OcorrenciaInput,
  OrientacaoCidada,
  Pagina,
  RelatorioLinha,
  ResultadoAtualizacao,
  Sessao,
  UsuarioPublico,
} from '@/models';

/**
 * Contratos da camada de serviços. As telas só conhecem estas interfaces;
 * a implementação (local ou API) é escolhida em `services/index.ts`.
 * Todo erro segue o formato { status, mensagem } (ver `ErroServico`).
 */

/** Java: cadastro, login, JWT e perfil. */
export interface AuthService {
  cadastrar(input: CadastroInput): Promise<Sessao>;
  entrar(input: LoginInput): Promise<Sessao>;
  sair(): Promise<void>;
  /** Sessão salva no aparelho (null se não houver ou se expirou). */
  restaurarSessao(): Promise<Sessao | null>;
  perfil(): Promise<UsuarioPublico>;
  /** Edita os dados da própria conta (hoje, o nome). */
  atualizarPerfil(input: PerfilInput): Promise<UsuarioPublico>;
  /** Exclui a própria conta e encerra a sessão. */
  excluirConta(): Promise<void>;
}

export interface PerfilInput {
  nome: string;
}

/** .NET: ocorrências. */
export interface OcorrenciaService {
  listar(filtro?: FiltroOcorrencias): Promise<Pagina<Ocorrencia>>;
  /** Todas as ocorrências visíveis (para o mapa). */
  listarTodas(filtro?: Omit<FiltroOcorrencias, 'pagina' | 'tamanho'>): Promise<Ocorrencia[]>;
  obter(id: string): Promise<Ocorrencia>;
  historico(id: string): Promise<HistoricoStatus[]>;
  minhas(): Promise<Ocorrencia[]>;
  criar(input: OcorrenciaInput): Promise<Ocorrencia>;
  editar(id: string, input: OcorrenciaInput): Promise<Ocorrencia>;
  excluir(id: string): Promise<void>;
}

/** .NET: atualizações e votos. */
export interface AtualizacaoService {
  listar(idOcorrencia: string): Promise<Atualizacao[]>;
  enviar(idOcorrencia: string, input: AtualizacaoInput): Promise<ResultadoAtualizacao>;
  /** Se a conta logada já votou no ciclo atual. */
  jaVotei(idOcorrencia: string): Promise<boolean>;
  /** Contadores do perfil: atualizações feitas e ocorrências resolvidas com a ajuda da conta. */
  resumoDaConta(): Promise<{ atualizacoes: number; resolvidasComAjuda: number }>;
}

/** .NET: categorias (leitura pública; escrita só ADMIN). */
export interface CategoriaService {
  listar(incluirInativas?: boolean): Promise<Categoria[]>;
  criar(input: CategoriaInput): Promise<Categoria>;
  editar(id: string, input: CategoriaInput): Promise<Categoria>;
  /** Contagem de ocorrências por categoria (para o aviso "3 ocorrências antigas"). */
  contarOcorrencias(): Promise<Record<string, number>>;
}

/** .NET: municípios. */
export interface MunicipioService {
  listar(): Promise<Municipio[]>;
}

/** .NET: relatórios ADMIN (só números agregados). */
export interface RelatorioService {
  ocorrencias(filtro?: FiltroRelatorio): Promise<RelatorioLinha[]>;
}

/** Java (Spring AI + RAG): orientação cidadã. */
export interface OrientacaoService {
  obter(idOcorrencia: string): Promise<OrientacaoCidada>;
}

/** Utilidades da fonte local (restaurar dados de exemplo para o vídeo). */
export interface DadosService {
  garantirDadosIniciais(): Promise<void>;
  restaurarDadosExemplo(): Promise<void>;
}
