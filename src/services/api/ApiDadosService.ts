// Com a API .NET, os dados vêm do servidor. Só as contas de teste (login em STANDBY
// até a API Java) continuam no aparelho.

import { garantirSeed } from '@/storage/seed';

import type { DadosService } from '../types';

import { MSG_STANDBY } from './standby';

export class ApiDadosService implements DadosService {
  async garantirDadosIniciais(): Promise<void> {
    await garantirSeed();
  }

  async restaurarDadosExemplo(): Promise<void> {
    throw new Error(MSG_STANDBY);
  }
}
