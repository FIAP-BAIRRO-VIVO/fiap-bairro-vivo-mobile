import { useEffect, useState } from 'react';

import type { Categoria, Municipio } from '@/models';
import { categoriaService, municipioService } from '@/services';

/** Categorias e municípios para filtros e formulários. */
export function useCatalogo(incluirInativas = false) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    Promise.all([categoriaService.listar(incluirInativas), municipioService.listar()])
      .then(([c, m]) => {
        if (!ativo) return;
        setCategorias(c);
        setMunicipios(m);
      })
      .catch(() => undefined)
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [incluirInativas]);

  return { categorias, municipios, carregando };
}
