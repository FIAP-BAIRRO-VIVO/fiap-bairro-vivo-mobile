// Integração com a API .NET (categorias).
//   GET    /api/categorias          (só ativas)
//   GET    /api/categorias/{id}     (inclusive inativas)
//   POST   /api/categorias          (ADMIN)
//   PUT    /api/categorias/{id}     (ADMIN; o corpo não tem "ativa")
//   DELETE /api/categorias/{id}     (ADMIN; desativa, não apaga)

import { MENSAGENS, ServiceError } from '@/domain/erros';
import type { Categoria, CategoriaInput, RelatorioLinha } from '@/models';
import { lerCategoriasDesativadas, marcarCategoriaDesativada } from '@/storage/registroApi';

import type { CategoriaService } from '../types';

import { apiDotnet } from './http';
import { CategoriaDto, categoriaDoApp, iconeDaApi } from './mapeadores';

function validar(input: CategoriaInput) {
  const nome = input.nome.trim();
  if (nome.length < 3)
    throw new ServiceError(400, MENSAGENS.dadosInvalidos, { nome: 'Use pelo menos 3 caracteres.' });
  if (nome.length > 60)
    throw new ServiceError(400, MENSAGENS.dadosInvalidos, { nome: 'Use no máximo 60 caracteres.' });
}

export class ApiDotnetCategoriaService implements CategoriaService {
  async listar(incluirInativas = false): Promise<Categoria[]> {
    const ativas = (await apiDotnet<CategoriaDto[]>('GET', '/api/categorias')).map(categoriaDoApp);
    if (!incluirInativas) return ativas;
    // A API não lista inativas: busca por id as que este aparelho desativou.
    const ids = (await lerCategoriasDesativadas()).filter((id) => !ativas.some((c) => c.id === id));
    const inativas = await Promise.all(
      ids.map((id) =>
        apiDotnet<CategoriaDto>('GET', `/api/categorias/${id}`)
          .then(categoriaDoApp)
          .catch(() => null),
      ),
    );
    return [...ativas, ...inativas.filter((c): c is Categoria => !!c && !c.ativa)];
  }

  private corpo(input: CategoriaInput) {
    return {
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      icone: iconeDaApi(input.icone) ?? null,
    };
  }

  async criar(input: CategoriaInput): Promise<Categoria> {
    validar(input);
    const dto = await apiDotnet<CategoriaDto>('POST', '/api/categorias', {
      auth: 'obrigatoria',
      idempotente: true,
      body: this.corpo(input),
    });
    if (!input.ativa) {
      await apiDotnet('DELETE', `/api/categorias/${dto.id}`, { auth: 'obrigatoria' });
      await marcarCategoriaDesativada(String(dto.id));
      return { ...categoriaDoApp(dto), ativa: false };
    }
    return categoriaDoApp(dto);
  }

  async editar(id: string, input: CategoriaInput): Promise<Categoria> {
    validar(input);
    const atual = categoriaDoApp(await apiDotnet<CategoriaDto>('GET', `/api/categorias/${id}`));
    if (!atual.ativa && input.ativa) {
      // STANDBY: a API .NET não tem como reativar uma categoria.
      throw new ServiceError(409, 'A API ainda não permite reativar uma categoria desativada.');
    }
    const mudouDados =
      atual.nome !== input.nome.trim() ||
      (atual.descricao ?? '') !== (input.descricao?.trim() ?? '') ||
      atual.icone !== input.icone;
    if (mudouDados) {
      await apiDotnet('PUT', `/api/categorias/${id}`, {
        auth: 'obrigatoria',
        body: this.corpo(input),
      });
    }
    if (atual.ativa && !input.ativa) {
      await apiDotnet('DELETE', `/api/categorias/${id}`, { auth: 'obrigatoria' });
      await marcarCategoriaDesativada(id);
    }
    return categoriaDoApp(await apiDotnet<CategoriaDto>('GET', `/api/categorias/${id}`));
  }

  /** Contagem por categoria a partir do relatório agregado (ADMIN). */
  async contarOcorrencias(): Promise<Record<string, number>> {
    const linhas = await apiDotnet<RelatorioLinha[]>('GET', '/api/admin/relatorios/ocorrencias', {
      auth: 'obrigatoria',
    });
    const r: Record<string, number> = {};
    for (const l of linhas)
      r[String(l.idCategoria)] = (r[String(l.idCategoria)] ?? 0) + l.totalOcorrencias;
    return r;
  }
}
