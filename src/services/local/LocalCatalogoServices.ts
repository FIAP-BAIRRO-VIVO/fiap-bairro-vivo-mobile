import { MENSAGENS, ServiceError } from '@/domain/erros';
import type {
  Categoria,
  CategoriaInput,
  FiltroRelatorio,
  Municipio,
  Ocorrencia,
  RelatorioLinha,
} from '@/models';
import { gravarDadosExemplo, garantirSeed } from '@/storage/seed';
import { gravarJSON, KEYS, lerJSON } from '@/storage/storage';

import type { CategoriaService, DadosService, MunicipioService, RelatorioService } from '../types';

import { exigirAdmin, novoId, simularRede } from './util';

function validarCategoria(input: CategoriaInput, existentes: Categoria[], id?: string) {
  const nome = input.nome.trim();
  const erros: Record<string, string> = {};
  if (nome.length < 3) erros.nome = 'Use pelo menos 3 caracteres.';
  else if (nome.length > 60) erros.nome = 'Use no máximo 60 caracteres.';
  else if (existentes.some((c) => c.id !== id && c.nome.toLowerCase() === nome.toLowerCase()))
    erros.nome = 'Já existe uma categoria com esse nome.';
  if ((input.descricao ?? '').length > 120) erros.descricao = 'Use no máximo 120 caracteres.';
  if (Object.keys(erros).length) throw new ServiceError(400, MENSAGENS.dadosInvalidos, erros);
}

export class LocalCategoriaService implements CategoriaService {
  async listar(incluirInativas = false): Promise<Categoria[]> {
    await simularRede(100);
    const todas = await lerJSON<Categoria[]>(KEYS.categorias, []);
    return incluirInativas ? todas : todas.filter((c) => c.ativa);
  }

  async criar(input: CategoriaInput): Promise<Categoria> {
    await simularRede();
    await exigirAdmin();
    const todas = await lerJSON<Categoria[]>(KEYS.categorias, []);
    validarCategoria(input, todas);
    const nova: Categoria = {
      id: novoId('cat'),
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || undefined,
      icone: input.icone,
      ativa: input.ativa,
    };
    await gravarJSON(KEYS.categorias, [...todas, nova]);
    return nova;
  }

  async editar(id: string, input: CategoriaInput): Promise<Categoria> {
    await simularRede();
    await exigirAdmin();
    const todas = await lerJSON<Categoria[]>(KEYS.categorias, []);
    const atual = todas.find((c) => c.id === id);
    if (!atual) throw new ServiceError(404, 'Categoria não encontrada.');
    validarCategoria(input, todas, id);
    const editada: Categoria = {
      ...atual,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || undefined,
      icone: input.icone,
      ativa: input.ativa,
    };
    // As ocorrências antigas guardam uma cópia da categoria: atualiza nome/ícone nelas também.
    const ocorrencias = await lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []);
    await gravarJSON(
      KEYS.categorias,
      todas.map((c) => (c.id === id ? editada : c)),
    );
    await gravarJSON(
      KEYS.ocorrencias,
      ocorrencias.map((o) => (o.categoria.id === id ? { ...o, categoria: editada } : o)),
    );
    return editada;
  }

  async contarOcorrencias(): Promise<Record<string, number>> {
    const ocorrencias = await lerJSON<Ocorrencia[]>(KEYS.ocorrencias, []);
    const r: Record<string, number> = {};
    for (const o of ocorrencias) {
      if (o.excluida) continue;
      r[o.categoria.id] = (r[o.categoria.id] ?? 0) + 1;
    }
    return r;
  }
}

export class LocalMunicipioService implements MunicipioService {
  async listar(): Promise<Municipio[]> {
    await simularRede(80);
    return lerJSON<Municipio[]>(KEYS.municipios, []);
  }
}

export class LocalRelatorioService implements RelatorioService {
  async ocorrencias(filtro: FiltroRelatorio = {}): Promise<RelatorioLinha[]> {
    await simularRede();
    await exigirAdmin();
    const ocorrencias = (await lerJSON<Ocorrencia[]>(KEYS.ocorrencias, [])).filter(
      (o) =>
        !o.excluida &&
        (!filtro.municipioId || o.municipio.id === filtro.municipioId) &&
        (!filtro.categoriaId || o.categoria.id === filtro.categoriaId) &&
        (!filtro.status || o.status === filtro.status),
    );
    const linhas = new Map<string, RelatorioLinha>();
    for (const o of ocorrencias) {
      const chave = `${o.municipio.id}|${o.categoria.id}|${o.status}`;
      const linha = linhas.get(chave) ?? {
        idMunicipio: o.municipio.id,
        nomeMunicipio: o.municipio.nome,
        uf: o.municipio.uf,
        idCategoria: o.categoria.id,
        nomeCategoria: o.categoria.nome,
        status: o.status,
        totalOcorrencias: 0,
      };
      linha.totalOcorrencias += 1;
      linhas.set(chave, linha);
    }
    return [...linhas.values()];
  }
}

export class LocalDadosService implements DadosService {
  async garantirDadosIniciais(): Promise<void> {
    await garantirSeed();
  }

  async restaurarDadosExemplo(): Promise<void> {
    await gravarDadosExemplo();
  }
}
