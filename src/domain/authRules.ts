import type { CadastroInput, LoginInput } from '@/models';

export const SENHA_MIN = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailValido(email: string): boolean {
  return EMAIL_RE.test(normalizarEmail(email));
}

export type ErrosCadastro = Partial<Record<keyof CadastroInput, string>>;

export function validarCadastro(input: CadastroInput): ErrosCadastro {
  const erros: ErrosCadastro = {};
  if (input.nome.trim().length < 2) erros.nome = 'Digite seu nome.';
  if (!emailValido(input.email)) erros.email = 'Digite um email válido, como nome@dominio.com';
  if (input.senha.length < SENHA_MIN) erros.senha = 'A senha precisa ter pelo menos 8 caracteres.';
  if (!input.confirmacaoSenha) erros.confirmacaoSenha = 'Repita a senha.';
  else if (input.confirmacaoSenha !== input.senha)
    erros.confirmacaoSenha = 'As senhas não são iguais';
  return erros;
}

export type ErrosLogin = Partial<Record<keyof LoginInput, string>>;

export function validarLogin(input: LoginInput): ErrosLogin {
  const erros: ErrosLogin = {};
  if (!emailValido(input.email)) erros.email = 'Digite um email válido, como nome@dominio.com';
  if (!input.senha) erros.senha = 'Digite sua senha.';
  return erros;
}

/** Iniciais para o avatar do perfil ("Maria Souza" → "MS"). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Valida a edição do perfil (nome de 2 a 120 caracteres). */
export function validarPerfil(input: { nome: string }): Record<string, string> {
  const nome = input.nome.trim();
  if (nome.length < 2) return { nome: 'Digite seu nome.' };
  if (nome.length > 120) return { nome: 'Use no máximo 120 caracteres.' };
  return {};
}
