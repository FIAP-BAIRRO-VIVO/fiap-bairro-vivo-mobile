import type {
  Categoria,
  Midia,
  Municipio,
  Ocorrencia,
  OcorrenciaInput,
  Perfil,
  UsuarioPublico,
} from '@/models';

import { MENSAGENS, ServiceError } from './erros';

export const LIMITES = {
  tituloMin: 5,
  tituloMax: 150,
  descricaoMin: 10,
  enderecoMax: 255,
  fotosMax: 3,
} as const;

export const AUTOR_ANONIMO = 'Cidadão anônimo';

export type ErrosCampos = Partial<
  Record<
    | 'titulo'
    | 'descricao'
    | 'idCategoria'
    | 'idMunicipio'
    | 'local'
    | 'enderecoReferencia'
    | 'fotos',
    string
  >
>;

/**
 * Valida os campos de uma ocorrência. Retorna um objeto vazio quando está tudo certo.
 * `categorias` e `municipios` são as listas conhecidas, para checar se existem e se a
 * categoria está ativa. `categoriaAtualId` permite manter, na edição, uma categoria
 * que foi desativada depois do registro.
 */
export function validarOcorrencia(
  input: OcorrenciaInput,
  categorias: Categoria[],
  municipios: Municipio[],
  categoriaAtualId?: string,
): ErrosCampos {
  const erros: ErrosCampos = {};
  const titulo = input.titulo.trim();
  const descricao = input.descricao.trim();
  const endereco = input.enderecoReferencia?.trim() ?? '';

  if (!titulo) erros.titulo = 'Conte em poucas palavras qual é o problema.';
  else if (titulo.length < LIMITES.tituloMin)
    erros.titulo = 'Escreva pelo menos 5 caracteres. Ex.: "Buraco na Rua Javari".';
  else if (titulo.length > LIMITES.tituloMax)
    erros.titulo = `Use no máximo ${LIMITES.tituloMax} caracteres.`;

  if (!descricao) erros.descricao = 'Descreva o que está acontecendo.';
  else if (descricao.length < LIMITES.descricaoMin)
    erros.descricao = 'Escreva pelo menos 10 caracteres para os vizinhos entenderem.';

  if (endereco.length > LIMITES.enderecoMax)
    erros.enderecoReferencia = `Use no máximo ${LIMITES.enderecoMax} caracteres.`;

  const categoria = categorias.find((c) => c.id === input.idCategoria);
  if (!input.idCategoria || !categoria) erros.idCategoria = 'Escolha uma categoria.';
  else if (!categoria.ativa && categoria.id !== categoriaAtualId)
    erros.idCategoria = 'Esta categoria foi desativada. Escolha outra.';

  if (!input.idMunicipio || !municipios.some((m) => m.id === input.idMunicipio))
    erros.idMunicipio = 'Escolha o município.';

  const { latitude, longitude } = input;
  if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude))
    erros.local = 'Marque o local no mapa ou use sua localização.';
  else if (latitude < -90 || latitude > 90) erros.local = 'Latitude deve ficar entre -90 e 90.';
  else if (longitude < -180 || longitude > 180)
    erros.local = 'Longitude deve ficar entre -180 e 180.';

  if (input.fotos.length > LIMITES.fotosMax) erros.fotos = 'Envie no máximo 3 fotos.';

  return erros;
}

export function temErros(erros: object): boolean {
  return Object.keys(erros).length > 0;
}

export function exibicaoAutor(nome: string, anonimo: boolean): string {
  return anonimo ? AUTOR_ANONIMO : nome;
}

/** ADMIN só consulta relatórios e gerencia categorias. */
export function garantirCidadao(perfil: Perfil | undefined): void {
  if (!perfil) throw new ServiceError(401, MENSAGENS.naoAutenticado);
  if (perfil !== 'CIDADAO') throw new ServiceError(403, MENSAGENS.adminSoLeitura);
}

/** Monta uma nova ocorrência: sempre nasce ABERTA, ciclo 1, sem votos. */
export function criarOcorrencia(params: {
  id: string;
  input: OcorrenciaInput;
  autor: UsuarioPublico;
  categoria: Categoria;
  municipio: Municipio;
  midias: Midia[];
  agora: string;
}): Ocorrencia {
  const { id, input, autor, categoria, municipio, midias, agora } = params;
  garantirCidadao(autor.perfil);
  return {
    id,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    status: 'ABERTA',
    numeroCiclo: 1,
    categoria,
    municipio,
    latitude: input.latitude as number,
    longitude: input.longitude as number,
    enderecoReferencia: input.enderecoReferencia?.trim() || undefined,
    idAutor: autor.id,
    autorExibicao: exibicaoAutor(autor.nome, input.anonimoPublico),
    anonimoPublico: input.anonimoPublico,
    dtCriacao: agora,
    dtAtualizacao: agora,
    midias,
    totalVotosCiclo: 0,
    excluida: false,
  };
}

export function ehAutor(ocorrencia: Ocorrencia, idUsuario: string | undefined): boolean {
  return !!idUsuario && ocorrencia.idAutor === idUsuario;
}

export function garantirAutor(ocorrencia: Ocorrencia, idUsuario: string | undefined): void {
  if (!idUsuario) throw new ServiceError(401, MENSAGENS.naoAutenticado);
  if (!ehAutor(ocorrencia, idUsuario)) throw new ServiceError(403, MENSAGENS.soAutor);
}

/**
 * Aplica uma edição feita pelo autor. Status, ciclo, autor, votos e data de criação
 * nunca mudam pela edição.
 */
export function aplicarEdicao(params: {
  ocorrencia: Ocorrencia;
  input: OcorrenciaInput;
  idUsuario: string;
  nomeAutor: string;
  categoria: Categoria;
  municipio: Municipio;
  midias: Midia[];
  agora: string;
}): Ocorrencia {
  const { ocorrencia, input, idUsuario, nomeAutor, categoria, municipio, midias, agora } = params;
  garantirAutor(ocorrencia, idUsuario);
  return {
    ...ocorrencia,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    categoria,
    municipio,
    latitude: input.latitude as number,
    longitude: input.longitude as number,
    enderecoReferencia: input.enderecoReferencia?.trim() || undefined,
    anonimoPublico: input.anonimoPublico,
    autorExibicao: exibicaoAutor(nomeAutor, input.anonimoPublico),
    midias,
    dtAtualizacao: agora,
    // Campos protegidos, sempre preservados:
    status: ocorrencia.status,
    numeroCiclo: ocorrencia.numeroCiclo,
    idAutor: ocorrencia.idAutor,
    totalVotosCiclo: ocorrencia.totalVotosCiclo,
    dtCriacao: ocorrencia.dtCriacao,
    excluida: ocorrencia.excluida,
  };
}

/** Exclusão lógica: a ocorrência sai das listas, mas o histórico fica guardado. */
export function excluirLogicamente(
  ocorrencia: Ocorrencia,
  idUsuario: string,
  agora: string,
): Ocorrencia {
  garantirAutor(ocorrencia, idUsuario);
  return { ...ocorrencia, excluida: true, dtAtualizacao: agora };
}
