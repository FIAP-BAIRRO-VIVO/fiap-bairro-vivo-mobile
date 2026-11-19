// API Java (Spring AI + RAG) — orientação cidadã.
//   GET  /api/v1/ia/orientacoes/ocorrencias/{id}   (público; página { conteudo, ... })
//   POST /api/v1/ia/orientacoes { ocorrenciaId }   (CIDADAO com JWT da Java)
// Sem orientação publicada nem como pedir uma nova, usa a base local de demonstração
// (marcada na tela como "Base local"), nunca uma resposta inventada.

import type { OrientacaoCidada } from '@/models';
import { carregarSessao } from '@/storage/sessionStore';

import type { OrientacaoService } from '../types';

import { apiJava } from './httpJava';
import { OrientacaoJavaDto, orientacaoDaJava, PaginaJavaDto } from './mapeadoresJava';

export class ApiJavaOrientacaoService implements OrientacaoService {
  constructor(private baseLocal: OrientacaoService) {}

  async obter(idOcorrencia: string): Promise<OrientacaoCidada> {
    try {
      const pagina = await apiJava<PaginaJavaDto<OrientacaoJavaDto>>(
        'GET',
        `/ia/orientacoes/ocorrencias/${encodeURIComponent(idOcorrencia)}`,
        { query: { page: 0, size: 10 } },
      );
      const publicada = (pagina.conteudo ?? [])
        .map(orientacaoDaJava)
        .find((o) => o.estado !== 'ERRO');
      if (publicada) return publicada;

      const sessao = await carregarSessao();
      if (sessao?.emissor === 'JAVA' && sessao.perfil === 'CIDADAO') {
        const nova = orientacaoDaJava(
          await apiJava<OrientacaoJavaDto>('POST', '/ia/orientacoes', {
            body: { ocorrenciaId: idOcorrencia },
          }),
        );
        if (nova.estado !== 'ERRO') return nova;
      }
    } catch {
      // API Java fora do ar ou recusando o token: segue para a base local.
    }
    return { ...(await this.baseLocal.obter(idOcorrencia)), origem: 'BASE_LOCAL' };
  }
}
