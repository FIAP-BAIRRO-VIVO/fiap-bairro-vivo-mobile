import * as Crypto from 'expo-crypto';

import { normalizarEmail, validarCadastro, validarLogin } from '@/domain/authRules';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { CadastroInput, LoginInput, Sessao, Usuario, UsuarioPublico } from '@/models';
import { hashSenha } from '@/storage/seed';
import { carregarSessao, salvarSessao, sessaoExpirada } from '@/storage/sessionStore';
import { gravarJSON, KEYS, lerJSON } from '@/storage/storage';

import type { AuthService } from '../types';

import { comErroPadrao, exigirSessao, novoId, publico, simularRede } from './util';

const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

function criarSessao(u: Usuario): Sessao {
  return {
    // Token opaco local. STANDBY: o JWT real virá da API Java.
    token: `local.${Crypto.randomUUID()}`,
    tipo: 'Bearer',
    idUsuario: u.id,
    perfil: u.perfil,
    nome: u.nome,
    email: u.email,
    expiraEm: new Date(Date.now() + VALIDADE_MS).toISOString(),
    emissor: 'LOCAL',
  };
}

export class LocalAuthService implements AuthService {
  async cadastrar(input: CadastroInput): Promise<Sessao> {
    await simularRede();
    const erros = validarCadastro(input);
    if (Object.keys(erros).length > 0) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);

    return comErroPadrao(async () => {
      const usuarios = await lerJSON<Usuario[]>(KEYS.usuarios, []);
      const email = normalizarEmail(input.email);
      if (usuarios.some((u) => u.email === email)) {
        throw new ServiceError(409, 'Este email já tem conta. Tente entrar.', {
          email: 'Este email já tem conta. Tente entrar.',
        });
      }
      const novo: Usuario = {
        id: novoId('u'),
        nome: input.nome.trim(),
        email,
        perfil: 'CIDADAO',
        senhaHash: await hashSenha(input.senha),
        ativo: true,
      };
      await gravarJSON(KEYS.usuarios, [...usuarios, novo]);
      const sessao = criarSessao(novo);
      await salvarSessao(sessao);
      return sessao;
    });
  }

  async entrar(input: LoginInput): Promise<Sessao> {
    await simularRede();
    const erros = validarLogin(input);
    if (Object.keys(erros).length > 0) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);

    const usuarios = await lerJSON<Usuario[]>(KEYS.usuarios, []);
    const email = normalizarEmail(input.email);
    const hash = await hashSenha(input.senha);
    const u = usuarios.find((x) => x.email === email);
    if (!u || !u.senhaHash || u.senhaHash !== hash || !u.ativo) {
      throw new ServiceError(401, 'Email ou senha não conferem.');
    }
    const sessao = criarSessao(u);
    await salvarSessao(sessao);
    return sessao;
  }

  async sair(): Promise<void> {
    await salvarSessao(null);
  }

  async restaurarSessao(): Promise<Sessao | null> {
    const s = await carregarSessao();
    if (s && sessaoExpirada(s)) {
      await salvarSessao(null);
      return null;
    }
    return s;
  }

  async perfil(): Promise<UsuarioPublico> {
    await simularRede(80);
    const { usuario } = await exigirSessao();
    const usuarios = await lerJSON<Usuario[]>(KEYS.usuarios, []);
    const u = usuarios.find((x) => x.id === usuario.id);
    if (!u) throw new ServiceError(404, 'Conta não encontrada.');
    return publico(u);
  }
}
