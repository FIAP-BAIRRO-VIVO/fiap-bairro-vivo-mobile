/**
 * Bateria de testes de contrato contra a API .NET publicada.
 * Uso: npm run test:api   (ou API_DOTNET_URL=https://... npm run test:api)
 *
 * Cria uma ocorrência e uma categoria de teste, exercita leitura, escrita, votação,
 * permissões e erros, e no fim exclui o que criou (exclusão lógica).
 * Usa os usuários do Oracle: 1, 2, 3 (CIDADAO) e 5 (ADMIN).
 * Os casos marcados como "BUG API" documentam divergências conhecidas da regra.
 */
const B = process.env.API_DOTNET_URL ?? 'https://fiap-bairro-vivo-csharp.onrender.com';
const resultados = [];

async function token(idUsuario, perfil) {
  const r = await fetch(`${B}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idUsuario, email: `teste${idUsuario}@exemplo.test`, perfil }),
  });
  return (await r.json()).token;
}

async function req(nome, metodo, caminho, { tk, body, esperado, headers = {} } = {}) {
  const h = { ...headers };
  if (tk) h.Authorization = `Bearer ${tk}`;
  if (body !== undefined) h['Content-Type'] = 'application/json';
  const t0 = Date.now();
  const r = await fetch(`${B}${caminho}`, {
    method: metodo,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const txt = await r.text();
  let json = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {
    /* texto */
  }
  const ok = esperado === undefined ? r.ok : [].concat(esperado).includes(r.status);
  resultados.push({
    ok,
    nome,
    metodo,
    caminho,
    status: r.status,
    esperado,
    ms: Date.now() - t0,
    resumo: txt.slice(0, 160),
    location: r.headers.get('location'),
  });
  return { status: r.status, json, txt, headers: r.headers };
}

const ana = await token(1, 'CIDADAO');
const bruno = await token(2, 'CIDADAO');
const carla = await token(3, 'CIDADAO');
const admin = await token(5, 'ADMIN');
const fantasma = await token(999999, 'CIDADAO');

// --- Leituras públicas / autenticadas
await req('health live', 'GET', '/api/health/live');
await req('health db', 'GET', '/api/health/db');
await req('categorias anon', 'GET', '/api/categorias', { esperado: [200, 401] });
await req('categorias', 'GET', '/api/categorias', { tk: ana });
await req('categoria por id', 'GET', '/api/categorias/1', { tk: ana });
await req('categoria inexistente', 'GET', '/api/categorias/999999', { tk: ana, esperado: 404 });
await req('municipios anon', 'GET', '/api/municipios', { esperado: [200, 401] });
await req('municipios filtro nome', 'GET', '/api/municipios?nome=Paulo', { tk: ana });
await req('municipios filtro uf', 'GET', '/api/municipios?uf=SP', { tk: ana });
await req('municipio por id', 'GET', '/api/municipios/1', { tk: ana });
await req('municipio inexistente', 'GET', '/api/municipios/999999', { tk: ana, esperado: 404 });
await req('ocorrencias anon', 'GET', '/api/ocorrencias?pagina=1&tamanho=10', {
  esperado: [200, 401],
});
await req('ocorrencias status', 'GET', '/api/ocorrencias?status=ABERTA', { tk: ana });
await req('ocorrencias categoria', 'GET', '/api/ocorrencias?categoriaId=1', { tk: ana });
await req('ocorrencias municipio', 'GET', '/api/ocorrencias?municipioId=1', { tk: ana });
for (const ordem of ['RECENTES', 'recentes', 'ANTIGAS', 'MAIS_VOTADAS', 'votos', 'antigas']) {
  await req(`ocorrencias ordem=${ordem}`, 'GET', `/api/ocorrencias?ordem=${ordem}&tamanho=50`, {
    tk: ana,
  });
}
await req(
  'ocorrencias bbox',
  'GET',
  '/api/ocorrencias?minLat=-24&maxLat=-23&minLon=-47&maxLon=-46',
  { tk: ana },
);
await req('ocorrencias tamanho 200', 'GET', '/api/ocorrencias?pagina=1&tamanho=200', { tk: ana });
await req('ocorrencia inexistente', 'GET', '/api/ocorrencias/999999', { tk: ana, esperado: 404 });
await req('minhas anon', 'GET', '/api/ocorrencias/minhas', { esperado: 401 });
await req('minhas ana', 'GET', '/api/ocorrencias/minhas?pagina=1&tamanho=50', { tk: ana });
await req('minhas usuario inexistente', 'GET', '/api/ocorrencias/minhas', {
  tk: fantasma,
  esperado: [200, 403],
});

// --- Criar ocorrência
const nova = {
  categoriaId: 1,
  municipioId: 1,
  titulo: 'TESTE APP mobile - buraco',
  descricao: 'Ocorrência criada pelos testes automáticos do app mobile.',
  latitude: -23.5489,
  longitude: -46.5964,
  enderecoReferencia: 'Rua de teste, 1 · Mooca',
  anonimoPublico: false,
};
await req('criar anon', 'POST', '/api/ocorrencias', { body: nova, esperado: 401 });
await req('criar invalida', 'POST', '/api/ocorrencias', {
  tk: ana,
  body: { ...nova, titulo: 'Bu', latitude: 120 },
  esperado: 400,
});
await req('criar admin', 'POST', '/api/ocorrencias', {
  tk: admin,
  body: nova,
  esperado: [403, 201],
});
const chave = `teste-${Date.now()}`;
const c1 = await req('criar ana (idempotente)', 'POST', '/api/ocorrencias', {
  tk: ana,
  body: nova,
  esperado: 201,
  headers: { 'Idempotency-Key': chave },
});
const c2 = await req('repetir mesma chave', 'POST', '/api/ocorrencias', {
  tk: ana,
  body: nova,
  esperado: [201, 200],
  headers: { 'Idempotency-Key': chave },
});
const id = c1.json?.ocorrencia?.id ?? c1.json?.id;
resultados.push({
  ok: (c2.json?.ocorrencia?.id ?? c2.json?.id) === id,
  nome: 'idempotência devolve o mesmo id',
  metodo: '-',
  caminho: '-',
  status: c2.headers.get('x-idempotent-replay'),
  resumo: `id1=${id} id2=${c2.json?.ocorrencia?.id ?? c2.json?.id}`,
});
console.log('CRIADA', JSON.stringify(c1.json).slice(0, 600));

await req('obter criada', 'GET', `/api/ocorrencias/${id}`, { tk: bruno });
await req('obter criada anon', 'GET', `/api/ocorrencias/${id}`, { esperado: [200, 401] });
await req('editar por outro', 'PUT', `/api/ocorrencias/${id}`, {
  tk: bruno,
  body: { ...nova, titulo: 'invasor' },
  esperado: 403,
});
await req('editar autor', 'PUT', `/api/ocorrencias/${id}`, {
  tk: ana,
  body: { ...nova, titulo: 'TESTE APP mobile - editada', anonimoPublico: true },
});
const ed = await req('obter editada', 'GET', `/api/ocorrencias/${id}`, { tk: bruno });
console.log('EDITADA', JSON.stringify(ed.json).slice(0, 400));
await req('midia ocorrencia', 'POST', `/api/ocorrencias/${id}/midias`, {
  tk: ana,
  body: {
    provedor: 'URL_EXTERNA',
    chaveStorage: `teste/${Date.now()}/foto.jpg`,
    urlExibicao: 'https://picsum.photos/seed/bairrovivo/600/400',
    mimeType: 'image/jpeg',
    tamanhoBytes: 12345,
    tipoMidia: 'FOTO',
    principal: 'S',
  },
  esperado: 201,
});

// --- Atualizações e votos
await req(
  'BUG API: comentario vazio deveria ser 400',
  'POST',
  `/api/ocorrencias/${id}/atualizacoes`,
  { tk: bruno, body: { tipo: 'COMENTARIO', anonimoPublico: false }, esperado: 400 },
);
const com = await req('comentario', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: bruno,
  body: { tipo: 'COMENTARIO', texto: 'Vi hoje, continua lá.', anonimoPublico: true },
  esperado: 201,
});
console.log('COMENTARIO', JSON.stringify(com.json).slice(0, 500));
await req('persiste com ABERTA (evidencia)', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: carla,
  body: { tipo: 'PERSISTE', texto: 'Ainda aberto', anonimoPublico: false },
  esperado: 201,
});
const v1 = await req('voto 1 (autora)', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: ana,
  body: { tipo: 'RESOLVIDO', anonimoPublico: false },
  esperado: 201,
});
console.log('VOTO1', JSON.stringify(v1.json).slice(0, 500));
await req(
  'BUG API: voto repetido deveria ser 409 (vem 500)',
  'POST',
  `/api/ocorrencias/${id}/atualizacoes`,
  { tk: ana, body: { tipo: 'RESOLVIDO', anonimoPublico: false }, esperado: 409 },
);
await req('admin vota', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: admin,
  body: { tipo: 'RESOLVIDO', anonimoPublico: false },
  esperado: [403, 201],
});
const v2 = await req('voto 2 (outra conta)', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: bruno,
  body: {
    tipo: 'RESOLVIDO',
    texto: 'Tapado',
    anonimoPublico: false,
    urlFotoEvidencia: 'https://picsum.photos/seed/ev/400/300',
  },
  esperado: 201,
});
console.log('VOTO2', JSON.stringify(v2.json).slice(0, 500));
const pos = await req('obter apos 2 votos', 'GET', `/api/ocorrencias/${id}`, { tk: carla });
console.log(
  'APOS',
  pos.json?.status ?? pos.json?.ocorrencia?.status,
  pos.json?.numeroCiclo ?? pos.json?.ocorrencia?.numeroCiclo,
  pos.json?.totalVotosCiclo ?? pos.json?.ocorrencia?.totalVotosCiclo,
);
const hist = await req('historico', 'GET', `/api/ocorrencias/${id}/historico`, { tk: carla });
console.log('HISTORICO', hist.txt.slice(0, 400));
await req('persiste reabre 1', 'POST', `/api/ocorrencias/${id}/atualizacoes`, {
  tk: carla,
  body: { tipo: 'PERSISTE', anonimoPublico: false },
  esperado: 201,
});
const lista = await req(
  'listar atualizacoes',
  'GET',
  `/api/ocorrencias/${id}/atualizacoes?pagina=1&tamanho=50`,
  { tk: carla },
);
console.log('ATUALIZACOES', lista.txt.slice(0, 700));
const idAt = lista.json?.dados?.[0]?.id;
if (idAt) {
  await req('atualizacao por id', 'GET', `/api/atualizacoes/${idAt}`, { tk: carla });
  await req('midia atualizacao', 'POST', `/api/ocorrencias/${id}/atualizacoes/${idAt}/midias`, {
    tk: carla,
    body: {
      provedor: 'URL_EXTERNA',
      chaveStorage: `teste/${Date.now()}/ev.jpg`,
      urlExibicao: 'https://picsum.photos/seed/ev2/400/300',
      mimeType: 'image/jpeg',
      tamanhoBytes: 999,
      tipoMidia: 'FOTO',
      principal: 'N',
    },
    esperado: [201, 403],
  });
}
await req(
  'integracao total votos',
  'GET',
  `/api/ocorrencias/${id}/integracao-oracle/total-votos-ativos?tipoVoto=PERSISTE`,
  { tk: carla, esperado: [200, 401, 403, 500] },
);

// --- Relatórios e categorias
await req('relatorio cidadao', 'GET', '/api/admin/relatorios/ocorrencias', {
  tk: ana,
  esperado: 403,
});
await req('relatorio admin', 'GET', '/api/admin/relatorios/ocorrencias', { tk: admin });
await req(
  'relatorio admin filtros',
  'GET',
  '/api/admin/relatorios/ocorrencias?idMunicipio=1&idCategoria=1&status=ABERTA',
  { tk: admin },
);
await req('categoria criar cidadao', 'POST', '/api/categorias', {
  tk: ana,
  body: { nome: 'Teste cidadão' },
  esperado: 403,
});
const cat = await req('categoria criar admin', 'POST', '/api/categorias', {
  tk: admin,
  body: {
    nome: `Teste app ${Date.now() % 100000}`,
    descricao: 'criada pelo teste',
    icone: 'tag',
    slaDiasPadrao: 7,
  },
  esperado: 201,
});
console.log('CATEGORIA', cat.txt.slice(0, 300), cat.headers.get('location'));
const idCat = cat.json?.id;
if (idCat) {
  await req('categoria editar admin', 'PUT', `/api/categorias/${idCat}`, {
    tk: admin,
    body: {
      nome: `Teste app editada ${Date.now() % 100000}`,
      descricao: 'x',
      icone: 'tag',
      slaDiasPadrao: 5,
    },
    esperado: 204,
  });
  const cg = await req('categoria apos editar', 'GET', `/api/categorias/${idCat}`, { tk: admin });
  console.log('CAT EDITADA', cg.txt);
  await req('categoria excluir admin', 'DELETE', `/api/categorias/${idCat}`, {
    tk: admin,
    esperado: 204,
  });
  const cd = await req('categoria apos excluir', 'GET', `/api/categorias/${idCat}`, {
    tk: admin,
    esperado: [200, 404],
  });
  console.log('CAT EXCLUIDA', cd.txt);
  const todas = await req('categorias lista apos excluir', 'GET', '/api/categorias', { tk: admin });
  console.log('LISTA CONTEM EXCLUIDA?', todas.txt.includes(`"id":"${idCat}"`));
}

// --- Exclusão
await req('excluir por outro', 'DELETE', `/api/ocorrencias/${id}`, { tk: bruno, esperado: 403 });
await req('excluir autora', 'DELETE', `/api/ocorrencias/${id}`, { tk: ana, esperado: 204 });
await req('obter excluida', 'GET', `/api/ocorrencias/${id}`, { tk: ana, esperado: 404 });
await req('historico excluida', 'GET', `/api/ocorrencias/${id}/historico`, {
  tk: ana,
  esperado: [200, 404],
});
await req('token invalido', 'GET', '/api/ocorrencias/minhas', { tk: 'abc.def.ghi', esperado: 401 });

console.log('\n=== RESULTADOS ===');
for (const r of resultados)
  console.log(
    `${r.ok ? 'OK  ' : 'FALHA'} ${String(r.status).padEnd(4)} ${r.metodo} ${r.caminho} — ${r.nome}${r.ok ? '' : ` | esperado ${r.esperado} | ${r.resumo}`}`,
  );
console.log(`\n${resultados.filter((r) => r.ok).length}/${resultados.length} ok`);
