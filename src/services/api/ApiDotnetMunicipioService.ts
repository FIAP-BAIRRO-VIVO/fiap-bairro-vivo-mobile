// Integração com a API .NET (municípios): GET /api/municipios

import type { Municipio } from '@/models';

import type { MunicipioService } from '../types';

import { apiDotnet } from './http';
import { MunicipioDto, municipioDoApp } from './mapeadores';

let cache: Municipio[] | null = null;

export class ApiDotnetMunicipioService implements MunicipioService {
  async listar(): Promise<Municipio[]> {
    if (!cache) {
      const lista = await apiDotnet<MunicipioDto[]>('GET', '/api/municipios');
      cache = lista.map(municipioDoApp).sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return cache;
  }
}
