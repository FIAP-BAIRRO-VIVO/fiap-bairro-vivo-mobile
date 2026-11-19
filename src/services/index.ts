import { DATA_SOURCE } from '@/config/env';

import { ApiDadosService } from './api/ApiDadosService';
import { ApiDotnetAtualizacaoService } from './api/ApiDotnetAtualizacaoService';
import { ApiDotnetCategoriaService } from './api/ApiDotnetCategoriaService';
import { ApiDotnetMunicipioService } from './api/ApiDotnetMunicipioService';
import { ApiDotnetOcorrenciaService } from './api/ApiDotnetOcorrenciaService';
import { ApiDotnetRelatorioService } from './api/ApiDotnetRelatorioService';
import { ApiJavaAuthService } from './api/ApiJavaAuthService';
import { ApiJavaOrientacaoService } from './api/ApiJavaOrientacaoService';
import { PonteAuthService } from './api/PonteAuthService';
import { LocalAtualizacaoService } from './local/LocalAtualizacaoService';
import { LocalAuthService } from './local/LocalAuthService';
import {
  LocalCategoriaService,
  LocalDadosService,
  LocalMunicipioService,
  LocalRelatorioService,
} from './local/LocalCatalogoServices';
import { LocalOcorrenciaService } from './local/LocalOcorrenciaService';
import { LocalOrientacaoService } from './local/LocalOrientacaoService';
import type {
  AtualizacaoService,
  AuthService,
  CategoriaService,
  DadosService,
  MunicipioService,
  OcorrenciaService,
  OrientacaoService,
  RelatorioService,
} from './types';

/**
 * Ponto único de acesso aos dados. As telas importam daqui e nunca do
 * AsyncStorage ou das implementações. Troque a fonte em `src/config/env.ts`.
 */
const local = (DATA_SOURCE as string) === 'local';

// Login oficial: JWT da API Java. Só as contas de teste, que não existem no Java,
// usam o gerador de JWT de teste da API .NET (PonteAuthService).
export const authService: AuthService = local
  ? new LocalAuthService()
  : new ApiJavaAuthService(new PonteAuthService());
export const ocorrenciaService: OcorrenciaService = local
  ? new LocalOcorrenciaService()
  : new ApiDotnetOcorrenciaService();
export const atualizacaoService: AtualizacaoService = local
  ? new LocalAtualizacaoService()
  : new ApiDotnetAtualizacaoService();
export const categoriaService: CategoriaService = local
  ? new LocalCategoriaService()
  : new ApiDotnetCategoriaService();
export const municipioService: MunicipioService = local
  ? new LocalMunicipioService()
  : new ApiDotnetMunicipioService();
export const relatorioService: RelatorioService = local
  ? new LocalRelatorioService()
  : new ApiDotnetRelatorioService();
// Orientação: IA da API Java; sem resposta dela, base local de demonstração.
const orientacaoLocal = new LocalOrientacaoService((id) => ocorrenciaService.obter(id));
export const orientacaoService: OrientacaoService = local
  ? orientacaoLocal
  : new ApiJavaOrientacaoService(orientacaoLocal);
export const dadosService: DadosService = local ? new LocalDadosService() : new ApiDadosService();

/** O que a fonte ativa consegue fazer (as telas escondem o que não existe). */
export const recursos = {
  /** Envio de fotos do aparelho. STANDBY na API: falta o upload (só aceita URL hospedada). */
  enviarFotos: local,
  /** Botão escondido de restaurar dados de exemplo. */
  restaurarDados: local,
  /** Reativar categoria desativada (a API .NET não tem). */
  reativarCategoria: local,
  /** Criar conta nova (no modo API, pela API Java). */
  cadastro: true,
};

export { isErroServico, MENSAGENS, paraErroServico } from '@/domain/erros';
export type * from './types';
