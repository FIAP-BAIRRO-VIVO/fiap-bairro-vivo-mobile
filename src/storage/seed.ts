import * as Crypto from 'expo-crypto';

import type {
  Atualizacao,
  Categoria,
  HistoricoStatus,
  Municipio,
  Ocorrencia,
  Usuario,
} from '@/models';

import { gravarVarios, KEYS, lerJSON, remover } from './storage';

/** Aumente quando o formato dos dados de exemplo mudar. */
export const SEED_VERSAO = 1;

export async function hashSenha(senha: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);
}

const DIA = 24 * 60 * 60 * 1000;
const HORA = 60 * 60 * 1000;

export const CATEGORIAS: Categoria[] = [
  { id: 'cat-buraco', nome: 'Buraco', descricao: 'Asfalto e via', icone: 'buraco', ativa: true },
  {
    id: 'cat-iluminacao',
    nome: 'Iluminação',
    descricao: 'Postes e praças',
    icone: 'iluminacao',
    ativa: true,
  },
  { id: 'cat-arvore', nome: 'Árvore', descricao: 'Poda e queda', icone: 'arvore', ativa: true },
  { id: 'cat-lixo', nome: 'Lixo', descricao: 'Entulho e descarte', icone: 'lixo', ativa: true },
  {
    id: 'cat-vazamento',
    nome: 'Vazamento',
    descricao: 'Água e esgoto',
    icone: 'vazamento',
    ativa: true,
  },
  {
    id: 'cat-acessibilidade',
    nome: 'Acessibilidade',
    descricao: 'Calçadas e travessias',
    icone: 'acessibilidade',
    ativa: true,
  },
  {
    id: 'cat-pichacao',
    nome: 'Pichação',
    descricao: 'Muros e fachadas',
    icone: 'pichacao',
    ativa: false,
  },
];

export const MUNICIPIOS: Municipio[] = [
  { id: 'mun-sp', codigoIbge: 3550308, nome: 'São Paulo', uf: 'SP' },
  { id: 'mun-santo-andre', codigoIbge: 3547809, nome: 'Santo André', uf: 'SP' },
  { id: 'mun-sao-caetano', codigoIbge: 3548807, nome: 'São Caetano do Sul', uf: 'SP' },
];

/** Contas de teste (senhas em texto só no README). */
const CONTAS_TESTE = [
  { id: 'u-maria', nome: 'Maria Souza', email: 'maria@bairrovivo.com', senha: 'bairro123' },
  { id: 'u-joao', nome: 'João Lima', email: 'joao@bairrovivo.com', senha: 'bairro123' },
  {
    id: 'u-admin',
    nome: 'Carla Admin',
    email: 'admin@bairrovivo.com',
    senha: 'admin123',
    perfil: 'ADMIN' as const,
  },
];

/** Vizinhos que só aparecem como autores nos dados de exemplo (não fazem login). */
const VIZINHOS = [
  { id: 'u-bruno', nome: 'Bruno M.', email: 'bruno@vizinhos.exemplo' },
  { id: 'u-lucia', nome: 'Lúcia R.', email: 'lucia@vizinhos.exemplo' },
  { id: 'u-jose', nome: 'Seu José', email: 'jose@vizinhos.exemplo' },
];

function cat(id: string) {
  return CATEGORIAS.find((c) => c.id === id) as Categoria;
}

const SP = MUNICIPIOS[0];

export async function montarDadosExemplo(agora = Date.now()) {
  const iso = (msAtras: number) => new Date(agora - msAtras).toISOString();

  const usuarios: Usuario[] = [];
  for (const c of CONTAS_TESTE) {
    usuarios.push({
      id: c.id,
      nome: c.nome,
      email: c.email,
      perfil: c.perfil ?? 'CIDADAO',
      senhaHash: await hashSenha(c.senha),
      ativo: true,
    });
  }
  for (const v of VIZINHOS) {
    usuarios.push({ ...v, perfil: 'CIDADAO', senhaHash: '', ativo: true });
  }

  const base = (
    o: Omit<Ocorrencia, 'municipio' | 'midias' | 'excluida' | 'dtAtualizacao'> & {
      dtAtualizacao?: string;
    },
  ): Ocorrencia => ({
    municipio: SP,
    midias: [],
    excluida: false,
    dtAtualizacao: o.dtAtualizacao ?? o.dtCriacao,
    ...o,
  });

  const ocorrencias: Ocorrencia[] = [
    base({
      id: 'oc-taquari',
      titulo: 'Calçada quebrada na Rua Taquari',
      descricao:
        'Buraco de uns 40 cm na calçada, em frente ao número 520. Quem usa cadeira de rodas ou carrinho precisa descer para a rua.',
      status: 'ABERTA',
      numeroCiclo: 1,
      categoria: cat('cat-acessibilidade'),
      latitude: -23.5537,
      longitude: -46.5987,
      enderecoReferencia: 'Rua Taquari, 520 · Mooca',
      idAutor: 'u-maria',
      autorExibicao: 'Cidadão anônimo',
      anonimoPublico: true,
      dtCriacao: iso(12 * DIA),
      dtAtualizacao: iso(1 * DIA),
      totalVotosCiclo: 1,
    }),
    base({
      id: 'oc-postes',
      titulo: 'Três postes apagados na praça',
      descricao:
        'Os três postes da praça estão apagados há uma semana. À noite fica muito escuro para quem volta do metrô.',
      status: 'ABERTA',
      numeroCiclo: 1,
      categoria: cat('cat-iluminacao'),
      latitude: -23.5428,
      longitude: -46.5905,
      enderecoReferencia: 'Praça perto da Rua Catumbi · Belenzinho',
      idAutor: 'u-lucia',
      autorExibicao: 'Lúcia R.',
      anonimoPublico: false,
      dtCriacao: iso(3 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-paes',
      titulo: 'Buraco grande na Av. Paes de Barros',
      descricao:
        'Buraco no meio da faixa da direita, perto do ponto de ônibus. Carros desviam de repente.',
      status: 'RESOLVIDA',
      numeroCiclo: 2,
      categoria: cat('cat-buraco'),
      latitude: -23.5608,
      longitude: -46.5934,
      enderecoReferencia: 'Av. Paes de Barros, 1200 · Mooca',
      idAutor: 'u-bruno',
      autorExibicao: 'Bruno M.',
      anonimoPublico: false,
      dtCriacao: iso(20 * DIA),
      dtAtualizacao: iso(6 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-entulho',
      titulo: 'Entulho na esquina da escola',
      descricao:
        'Montes de entulho e restos de obra na calçada da esquina da escola. As crianças passam pela rua.',
      status: 'ABERTA',
      numeroCiclo: 1,
      categoria: cat('cat-lixo'),
      latitude: -23.5452,
      longitude: -46.6148,
      enderecoReferencia: 'Rua do Gasômetro · Brás',
      idAutor: 'u-jose',
      autorExibicao: 'Cidadão anônimo',
      anonimoPublico: true,
      dtCriacao: iso(1 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-arvore',
      titulo: 'Árvore com galho caindo na fiação',
      descricao:
        'Um galho grande quebrou com o vento e está apoiado nos fios do poste. Pode cair a qualquer momento.',
      status: 'ABERTA',
      numeroCiclo: 1,
      categoria: cat('cat-arvore'),
      latitude: -23.5402,
      longitude: -46.5761,
      enderecoReferencia: 'Rua Tuiuti, 1500 · Tatuapé',
      idAutor: 'u-maria',
      autorExibicao: 'Maria Souza',
      anonimoPublico: false,
      dtCriacao: iso(2 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-javari',
      titulo: 'Vazamento de água na Rua Javari',
      descricao:
        'Água limpa saindo do asfalto desde segunda, escorrendo até a esquina. Já está abrindo um buraco.',
      status: 'RESOLVIDA',
      numeroCiclo: 2,
      categoria: cat('cat-vazamento'),
      latitude: -23.5531,
      longitude: -46.6041,
      enderecoReferencia: 'Rua Javari, 300 · Mooca',
      idAutor: 'u-maria',
      autorExibicao: 'Maria Souza',
      anonimoPublico: false,
      dtCriacao: iso(9 * DIA),
      dtAtualizacao: iso(4 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-rampa',
      titulo: 'Rampa de acessibilidade bloqueada',
      descricao:
        'Carros estacionam na frente da rampa da esquina todos os dias. Cadeirantes não conseguem subir na calçada.',
      status: 'RESOLVIDA',
      numeroCiclo: 2,
      categoria: cat('cat-acessibilidade'),
      latitude: -23.5375,
      longitude: -46.5702,
      enderecoReferencia: 'Rua Itapura com Rua Serra de Botucatu · Tatuapé',
      idAutor: 'u-lucia',
      autorExibicao: 'Lúcia R.',
      anonimoPublico: false,
      dtCriacao: iso(15 * DIA),
      dtAtualizacao: iso(1 * DIA),
      totalVotosCiclo: 0,
    }),
    base({
      id: 'oc-siqueira',
      titulo: 'Buraco na Rua Siqueira Bueno',
      descricao:
        'Buraco fundo perto da faixa de pedestres. Já vi duas motos quase caírem esta semana.',
      status: 'ABERTA',
      numeroCiclo: 1,
      categoria: cat('cat-buraco'),
      latitude: -23.5463,
      longitude: -46.5958,
      enderecoReferencia: 'Rua Siqueira Bueno, 800 · Belenzinho',
      idAutor: 'u-bruno',
      autorExibicao: 'Bruno M.',
      anonimoPublico: false,
      dtCriacao: iso(8 * DIA),
      dtAtualizacao: iso(2 * DIA),
      totalVotosCiclo: 0,
    }),
  ];

  const at = (
    a: Omit<Atualizacao, 'statusAtual' | 'anonimoPublico' | 'autorExibicao'> & {
      statusAtual?: Atualizacao['statusAtual'];
      anonimoPublico?: boolean;
      autorExibicao?: string;
    },
  ): Atualizacao => {
    const autor = usuarios.find((u) => u.id === a.idAutor);
    const anonimo = a.anonimoPublico ?? false;
    return {
      statusAtual: 'ABERTA',
      anonimoPublico: anonimo,
      autorExibicao: anonimo ? 'Cidadão anônimo' : (autor?.nome ?? 'Vizinho'),
      ...a,
    };
  };

  const atualizacoes: Atualizacao[] = [
    at({
      id: 'at-taquari-1',
      idOcorrencia: 'oc-taquari',
      tipo: 'COMENTARIO',
      texto: 'Minha mãe tropeçou aqui semana passada.',
      idAutor: 'u-jose',
      anonimoPublico: true,
      contabilizadaComoVoto: false,
      numeroCiclo: 1,
      dtCriacao: iso(5 * DIA),
    }),
    at({
      id: 'at-taquari-2',
      idOcorrencia: 'oc-taquari',
      tipo: 'RESOLVIDO',
      texto: 'Vi a equipe tapando de manhã. Ainda falta a marcação.',
      idAutor: 'u-bruno',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(1 * DIA),
    }),
    at({
      id: 'at-paes-1',
      idOcorrencia: 'oc-paes',
      tipo: 'RESOLVIDO',
      texto: 'Asfaltaram ontem à noite.',
      idAutor: 'u-lucia',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(7 * DIA),
    }),
    at({
      id: 'at-paes-2',
      idOcorrencia: 'oc-paes',
      tipo: 'RESOLVIDO',
      texto: 'Confirmo, passei de ônibus e está liso.',
      idAutor: 'u-jose',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(6 * DIA),
    }),
    at({
      id: 'at-javari-1',
      idOcorrencia: 'oc-javari',
      tipo: 'RESOLVIDO',
      idAutor: 'u-bruno',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(5 * DIA),
    }),
    at({
      id: 'at-javari-2',
      idOcorrencia: 'oc-javari',
      tipo: 'RESOLVIDO',
      texto: 'A Sabesp consertou o cano.',
      idAutor: 'u-lucia',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(4 * DIA),
    }),
    at({
      id: 'at-rampa-1',
      idOcorrencia: 'oc-rampa',
      tipo: 'RESOLVIDO',
      texto: 'Colocaram um balizador na frente da rampa.',
      idAutor: 'u-bruno',
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(2 * DIA),
    }),
    at({
      id: 'at-rampa-2',
      idOcorrencia: 'oc-rampa',
      tipo: 'RESOLVIDO',
      idAutor: 'u-jose',
      anonimoPublico: true,
      contabilizadaComoVoto: true,
      numeroCiclo: 1,
      dtCriacao: iso(1 * DIA),
    }),
    at({
      id: 'at-siqueira-1',
      idOcorrencia: 'oc-siqueira',
      tipo: 'PERSISTE',
      texto: 'Passei hoje e continua igual, agora com água parada.',
      idAutor: 'u-lucia',
      contabilizadaComoVoto: false,
      numeroCiclo: 1,
      dtCriacao: iso(2 * DIA + 3 * HORA),
    }),
  ];

  const historico: HistoricoStatus[] = [
    {
      id: 'hi-paes-1',
      idOcorrencia: 'oc-paes',
      statusAnterior: 'ABERTA',
      statusNovo: 'RESOLVIDA',
      cicloAnterior: 1,
      cicloNovo: 2,
      dtEvento: iso(6 * DIA),
    },
    {
      id: 'hi-javari-1',
      idOcorrencia: 'oc-javari',
      statusAnterior: 'ABERTA',
      statusNovo: 'RESOLVIDA',
      cicloAnterior: 1,
      cicloNovo: 2,
      dtEvento: iso(4 * DIA),
    },
    {
      id: 'hi-rampa-1',
      idOcorrencia: 'oc-rampa',
      statusAnterior: 'ABERTA',
      statusNovo: 'RESOLVIDA',
      cicloAnterior: 1,
      cicloNovo: 2,
      dtEvento: iso(1 * DIA),
    },
  ];

  return {
    usuarios,
    categorias: CATEGORIAS,
    municipios: MUNICIPIOS,
    ocorrencias,
    atualizacoes,
    historico,
  };
}

/** Grava os dados de exemplo (sobrescreve tudo, menos a sessão). */
export async function gravarDadosExemplo(): Promise<void> {
  const d = await montarDadosExemplo();
  await gravarVarios([
    [KEYS.usuarios, d.usuarios],
    [KEYS.categorias, d.categorias],
    [KEYS.municipios, d.municipios],
    [KEYS.ocorrencias, d.ocorrencias],
    [KEYS.atualizacoes, d.atualizacoes],
    [KEYS.historico, d.historico],
    [KEYS.seedVersao, SEED_VERSAO],
  ]);
  await remover(KEYS.intencao);
}

/** Na primeira abertura, grava os dados de exemplo. */
export async function garantirSeed(): Promise<void> {
  const versao = await lerJSON<number | null>(KEYS.seedVersao, null);
  if (versao === null) await gravarDadosExemplo();
}
