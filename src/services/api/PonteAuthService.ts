// SOMENTE PARA TESTES. O login oficial do Bairro Vivo é o JWT emitido pela API Java
// (STANDBY). A API .NET não faz login: ela só valida o JWT do Java.
//
// Enquanto o Java não está publicado, esta ponte confere email e senha nas contas de
// teste do aparelho e pede um token ao gerador de JWT de teste da API .NET
// (POST /api/auth/token), ligado ao usuário correspondente no Oracle.
// Quando a API Java chegar, troque por ApiJavaAuthService em services/index.ts.

import { normalizarEmail, validarCadastro } from '@/domain/authRules';
import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { CadastroInput, LoginInput, Perfil, Sessao, UsuarioPublico } from '@/models';
import { carregarSessao, salvarSessao, sessaoExpirada } from '@/storage/sessionStore';

import { LocalAuthService } from '../local/LocalAuthService';
import type { AuthService, PerfilInput } from '../types';

import { apiDotnet } from './http';

/** Conta de teste do app → usuário do Oracle (TB_USUARIO). */
export const USUARIOS_API: Record<string, { idUsuario: number; perfil: Perfil }> = {
  'maria@bairrovivo.com': { idUsuario: 1, perfil: 'CIDADAO' },
  'joao@bairrovivo.com': { idUsuario: 2, perfil: 'CIDADAO' },
  'admin@bairrovivo.com': { idUsuario: 5, perfil: 'ADMIN' },
};

interface TokenDto {
  token: string;
  tipo: string;
  idUsuario: string;
  perfil: Perfil;
  expiraEm: string;
}

const SEM_CONTA_API =
  'Por enquanto só as contas de teste entram na API (o cadastro depende da API Java, em STANDBY).';

export class PonteAuthService implements AuthService {
  private local = new LocalAuthService();

  private async emitirToken(email: string, nome: string): Promise<Sessao> {
    const conta = USUARIOS_API[normalizarEmail(email)];
    if (!conta) throw new ServiceError(403, SEM_CONTA_API);
    const t = await apiDotnet<TokenDto>('POST', '/api/auth/token', {
      auth: 'nenhuma',
      body: { idUsuario: conta.idUsuario, email: normalizarEmail(email), perfil: conta.perfil },
    });
    const expira = new Date(
      /([zZ]|[+-]\d{2}:?\d{2})$/.test(t.expiraEm) ? t.expiraEm : `${t.expiraEm}Z`,
    );
    return {
      token: t.token,
      tipo: 'Bearer',
      idUsuario: String(t.idUsuario),
      perfil: t.perfil ?? conta.perfil,
      nome,
      email: normalizarEmail(email),
      emissor: 'TESTE_DOTNET',
      expiraEm: Number.isNaN(expira.getTime())
        ? new Date(Date.now() + 3.5 * 3600_000).toISOString()
        : expira.toISOString(),
    };
  }

  async entrar(input: LoginInput): Promise<Sessao> {
    // Confere a senha (hash SHA-256) nas contas do aparelho.
    const local = await this.local.entrar(input);
    try {
      const sessao = await this.emitirToken(local.email, local.nome);
      await salvarSessao(sessao);
      return sessao;
    } catch (e) {
      await salvarSessao(null);
      throw e;
    }
  }

  async cadastrar(input: CadastroInput): Promise<Sessao> {
    const erros = validarCadastro(input);
    if (Object.keys(erros).length) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
    throw new ServiceError(403, SEM_CONTA_API);
  }

  async sair(): Promise<void> {
    await salvarSessao(null);
  }

  async restaurarSessao(): Promise<Sessao | null> {
    const s = await carregarSessao();
    if (!s) return null;
    // Sessões antigas do modo local (sem JWT) ou vencidas não servem para a API.
    if (sessaoExpirada(s) || !s.token || s.token.startsWith('local.')) {
      await salvarSessao(null);
      return null;
    }
    return s;
  }

  async perfil(): Promise<UsuarioPublico> {
    const s = await carregarSessao();
    if (!s) throw new ServiceError(401, MENSAGENS.naoAutenticado);
    return { id: s.idUsuario, nome: s.nome, email: s.email, perfil: s.perfil, ativo: true };
  }

  /** Contas de teste são fixas no banco: não dá para editar nem excluir. */
  async atualizarPerfil(_input: PerfilInput): Promise<UsuarioPublico> {
    throw new ServiceError(403, CONTA_DE_TESTE);
  }

  async excluirConta(): Promise<void> {
    throw new ServiceError(403, CONTA_DE_TESTE);
  }
}

const CONTA_DE_TESTE = 'Contas de teste não podem ser editadas nem excluídas.';
