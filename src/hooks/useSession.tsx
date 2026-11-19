import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { CadastroInput, LoginInput, Sessao } from '@/models';
import { authService } from '@/services';
import { ouvirSessao } from '@/storage/sessionStore';

interface SessionContextValue {
  sessao: Sessao | null;
  carregando: boolean;
  /** Visitante escolheu "Explorar o mapa sem entrar". */
  visitante: boolean;
  entrarComoVisitante: () => void;
  entrar: (input: LoginInput) => Promise<Sessao>;
  cadastrar: (input: CadastroInput) => Promise<Sessao>;
  sair: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [visitante, setVisitante] = useState(false);

  useEffect(() => {
    let ativo = true;
    authService
      .restaurarSessao()
      .then((s) => ativo && setSessao(s))
      .catch(() => ativo && setSessao(null))
      .finally(() => ativo && setCarregando(false));
    // Mantém o contexto em dia quando um serviço limpa a sessão (ex.: 401).
    const parar = ouvirSessao((s) => setSessao(s));
    return () => {
      ativo = false;
      parar();
    };
  }, []);

  const entrar = useCallback(async (input: LoginInput) => {
    const s = await authService.entrar(input);
    setSessao(s);
    return s;
  }, []);

  const cadastrar = useCallback(async (input: CadastroInput) => {
    const s = await authService.cadastrar(input);
    setSessao(s);
    return s;
  }, []);

  const sair = useCallback(async () => {
    await authService.sair();
    setSessao(null);
    setVisitante(false);
  }, []);

  const entrarComoVisitante = useCallback(() => setVisitante(true), []);

  return (
    <SessionContext.Provider
      value={{ sessao, carregando, visitante, entrarComoVisitante, entrar, cadastrar, sair }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de SessionProvider');
  return ctx;
}
