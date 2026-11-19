// Integração com a API .NET (relatórios ADMIN): GET /api/admin/relatorios/ocorrencias

import type { FiltroRelatorio, RelatorioLinha } from '@/models';

import type { RelatorioService } from '../types';

import { apiDotnet } from './http';
import { relatorioDoApp } from './mapeadores';

export class ApiDotnetRelatorioService implements RelatorioService {
  async ocorrencias(filtro: FiltroRelatorio = {}): Promise<RelatorioLinha[]> {
    const linhas = await apiDotnet<RelatorioLinha[]>('GET', '/api/admin/relatorios/ocorrencias', {
      auth: 'obrigatoria',
      query: {
        idMunicipio: filtro.municipioId,
        idCategoria: filtro.categoriaId,
        status: filtro.status,
      },
    });
    return linhas.map(relatorioDoApp);
  }
}
