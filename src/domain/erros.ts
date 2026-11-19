import type { ErroServico, StatusErro } from '@/models';

/** Erro lançado pelos serviços, no formato { status, mensagem }. */
export class ServiceError extends Error implements ErroServico {
  status: StatusErro;
  mensagem: string;
  campos?: Record<string, string>;

  constructor(status: StatusErro, mensagem: string, campos?: Record<string, string>) {
    super(mensagem);
    this.name = 'ServiceError';
    this.status = status;
    this.mensagem = mensagem;
    this.campos = campos;
  }
}

export function isErroServico(e: unknown): e is ErroServico {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    'mensagem' in e &&
    typeof (e as ErroServico).mensagem === 'string'
  );
}

/** Converte qualquer falha no formato padrão (desconhecidos viram 500). */
export function paraErroServico(e: unknown): ErroServico {
  if (isErroServico(e)) return e;
  return {
    status: 500,
    mensagem: 'Não conseguimos conectar. Tente de novo em instantes.',
  };
}

export const MENSAGENS = {
  votoRepetido: 'Você já confirmou neste ciclo. Agora falta outro vizinho.',
  naoAutenticado: 'Entre para contribuir com a comunidade.',
  sessaoExpirada: 'Sua sessão expirou. Entre de novo para continuar.',
  soAutor: 'Só quem registrou pode editar.',
  adminSoLeitura: 'O perfil ADMIN só consulta relatórios e gerencia categorias.',
  naoEncontrada:
    'Registro indisponível. Esta ocorrência pode ter sido excluída por quem registrou.',
  muitasTentativas: 'Muitas ações seguidas. Espere um minuto e tente de novo.',
  dadosInvalidos: 'Confira os campos destacados.',
} as const;
