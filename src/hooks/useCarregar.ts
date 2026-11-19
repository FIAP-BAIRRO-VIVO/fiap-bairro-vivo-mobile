import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

import type { ErroServico } from '@/models';
import { paraErroServico } from '@/services';

interface Estado<T> {
  dados: T | null;
  erro: ErroServico | null;
  carregando: boolean;
}

/**
 * Carrega dados de um serviço com estados de carregando/erro.
 * Recarrega em silêncio quando a tela volta a ficar em foco (ex.: depois de editar).
 */
export function useCarregar<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: null, carregando: true });
  const [versao, setVersao] = useState(0);
  const fnRef = useRef(fn);
  const focou = useRef(false);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let ativo = true;
    fnRef.current().then(
      (dados) => ativo && setEstado({ dados, erro: null, carregando: false }),
      (e) => ativo && setEstado({ dados: null, erro: paraErroServico(e), carregando: false }),
    );
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao]);

  useFocusEffect(
    useCallback(() => {
      if (!focou.current) {
        focou.current = true;
        return;
      }
      setVersao((v) => v + 1);
    }, []),
  );

  const recarregar = useCallback(() => {
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    setVersao((v) => v + 1);
  }, []);

  const setDados = useCallback((dados: T) => setEstado((e) => ({ ...e, dados })), []);

  return { ...estado, recarregar, setDados };
}
