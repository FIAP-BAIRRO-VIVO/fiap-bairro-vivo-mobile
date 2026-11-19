// API Java (Spring Boot) — login oficial do Bairro Vivo.
//   POST /api/v1/auth/registrar  { nome, email, senha, confirmacaoSenha } → 201 { accessToken, tokenType, expiresIn, usuario }
//   POST /api/v1/auth/login      { email, senha }                         → 200 { accessToken, ... }
//   GET  /api/v1/usuarios/me     (Bearer)
// O JWT (RS256, iss "bairro-vivo-java", aud "bairro-vivo-apis", sub = id do usuário) vale
// também na API .NET.
//
// Contas de teste (maria/joao/admin@bairrovivo.com) não existem na API Java: para elas,
// e só para elas, o app usa o gerador de JWT de TESTE da API .NET (PonteAuthService).

import { normalizarEmail, validarCadastro, validarLogin } from '@/domain/authRules';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { CadastroInput, LoginInput, Sessao, UsuarioPublico } from '@/models';
import { carregarSessao, salvarSessao, sessaoExpirada } from '@/storage/sessionStore';

import type { AuthService } from '../types';

import { apiJava } from './httpJava';
import {
  AuthRespostaJavaDto,
  expiracaoDoJwt,
  perfilDaJava,
  UsuarioJavaDto,
} from './mapeadoresJava';
import { PonteAuthService, USUARIOS_API } from './PonteAuthService';

function sessaoDaJava(r: AuthRespostaJavaDto): Sessao {
  return {
    token: r.accessToken,
    tipo: 'Bearer',
    idUsuario: String(r.usuario.id),
    perfil: perfilDaJava(r.usuario),
    nome: r.usuario.nome,
    email: normalizarEmail(r.usuario.email),
    expiraEm: expiracaoDoJwt(r.accessToken, r.expiresIn),
    emissor: 'JAVA',
  };
}

export class ApiJavaAuthService implements AuthService {
  constructor(private contasDeTeste: PonteAuthService = new PonteAuthService()) {}

  async entrar(input: LoginInput): Promise<Sessao> {
    const erros = validarLogin(input);
    if (Object.keys(erros).length) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
    const email = normalizarEmail(input.email);
    try {
      const r = await apiJava<AuthRespostaJavaDto>('POST', '/auth/login', {
        token: null,
        body: { email, senha: input.senha },
      });
      const sessao = sessaoDaJava(r);
      await salvarSessao(sessao);
      return sessao;
    } catch (e) {
      // Conta de teste: o Java não a conhece (401) ou está fora do ar (500) → JWT de teste.
      if (USUARIOS_API[email] && e instanceof ServiceError && [401, 500].includes(e.status)) {
        return this.contasDeTeste.entrar(input);
      }
      throw e;
    }
  }

  async cadastrar(input: CadastroInput): Promise<Sessao> {
    const erros = validarCadastro(input);
    if (Object.keys(erros).length) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
    const r = await apiJava<AuthRespostaJavaDto>('POST', '/auth/registrar', {
      token: null,
      body: {
        nome: input.nome.trim(),
        email: normalizarEmail(input.email),
        senha: input.senha,
        confirmacaoSenha: input.confirmacaoSenha,
      },
    });
    const sessao = sessaoDaJava(r);
    await salvarSessao(sessao);
    return sessao;
  }

  async sair(): Promise<void> {
    // O contrato prevê logout só no app (sem revogação do JWT); /auth/logout é opcional.
    await salvarSessao(null);
  }

  async restaurarSessao(): Promise<Sessao | null> {
    const s = await carregarSessao();
    if (!s) return null;
    if (sessaoExpirada(s) || !s.token || s.token.startsWith('local.')) {
      await salvarSessao(null);
      return null;
    }
    return s;
  }

  async perfil(): Promise<UsuarioPublico> {
    const s = await carregarSessao();
    if (!s) throw new ServiceError(401, MENSAGENS.naoAutenticado);
    const daSessao: UsuarioPublico = {
      id: s.idUsuario,
      nome: s.nome,
      email: s.email,
      perfil: s.perfil,
      ativo: true,
    };
    if (s.emissor !== 'JAVA') return daSessao;
    try {
      const u = await apiJava<UsuarioJavaDto>('GET', '/usuarios/me');
      return {
        id: String(u.id),
        nome: u.nome,
        email: u.email,
        perfil: perfilDaJava(u),
        ativo: true,
      };
    } catch {
      // A API Java hoje recusa o próprio token em /usuarios/me (401): usa os dados do login.
      return daSessao;
    }
  }
}
