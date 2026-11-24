/**
 * Bateria de testes de contrato contra a API Java publicada.
 * Uso: npm run test:java   (ou API_JAVA_URL=https://... npm run test:java)
 *
 * Cria uma conta de teste (email @exemplo.test), testa login, token, perfil, IA,
 * CORS e a aceitação do JWT Java pela API .NET. Casos "BUG API" documentam
 * divergências conhecidas; o processo só falha se outro caso quebrar.
 */
const J = process.env.API_JAVA_URL ?? 'https://bairro-vivo-java-566385.azurewebsites.net';
const N = process.env.API_DOTNET_URL ?? 'https://fiap-bairro-vivo-csharp.onrender.com';
const resultados = [];

async function req(nome, metodo, url, { token, body, esperado, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined) h['Content-Type'] = 'application/json';
  let r;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // Falha de rede: registra e segue com os outros casos.
    resultados.push({ ok: false, nome, metodo, url, status: 'REDE', esperado, resumo: String(e.cause ?? e) });
    return { status: 0, json: null, headers: new Headers() };
  }
  const txt = await r.text();
  let json = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {
    /* texto */
  }
  const ok = [].concat(esperado ?? 200).includes(r.status);
  resultados.push({
    ok,
    nome,
    metodo,
    url: url.replace(J, '').replace(N, '[.NET]'),
    status: r.status,
    esperado,
    resumo: txt.slice(0, 160),
  });
  return { status: r.status, json, headers: r.headers };
}

const email = `teste.app.${Date.now()}@exemplo.test`;
const senha = 'SenhaTeste123';

await req('health', 'GET', `${J}/actuator/health`);
await req('BUG API: OpenAPI /v3/api-docs deveria ser 200', 'GET', `${J}/v3/api-docs`, {
  esperado: 200,
});
await req('registrar sem dados', 'POST', `${J}/api/v1/auth/registrar`, { body: {}, esperado: 400 });
await req('registrar email inválido', 'POST', `${J}/api/v1/auth/registrar`, {
  body: { nome: 'Teste', email: 'nao-e-email', senha, confirmacaoSenha: senha },
  esperado: 400,
});
const reg = await req('registrar', 'POST', `${J}/api/v1/auth/registrar`, {
  body: { nome: 'Teste App Mobile', email, senha, confirmacaoSenha: senha },
  esperado: 201,
});
const token = reg.json?.accessToken;
await req('registrar email repetido', 'POST', `${J}/api/v1/auth/registrar`, {
  body: { nome: 'Teste App Mobile', email, senha, confirmacaoSenha: senha },
  esperado: 409,
});
await req('login sem dados', 'POST', `${J}/api/v1/auth/login`, { body: {}, esperado: 400 });
await req('login email inexistente', 'POST', `${J}/api/v1/auth/login`, {
  body: { email: 'nao.existe@exemplo.test', senha },
  esperado: 401,
});
const login = await req(
  'BUG API: login correto deveria ser 200',
  'POST',
  `${J}/api/v1/auth/login`,
  {
    body: { email, senha },
    esperado: 200,
  },
);
await req('BUG API: login senha errada deveria ser 401', 'POST', `${J}/api/v1/auth/login`, {
  body: { email, senha: 'SenhaErrada999' },
  esperado: 401,
});
await req(
  'BUG API: rota inexistente em /auth deveria ser 404',
  'POST',
  `${J}/api/v1/auth/inexistente`,
  {
    body: {},
    esperado: 404,
  },
);

// Claims do token
if (token) {
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  const cab = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
  const okClaims =
    cab.alg === 'RS256' &&
    claims.iss === 'bairro-vivo-java' &&
    claims.aud === 'bairro-vivo-apis' &&
    /^\d+$/.test(claims.sub) &&
    Array.isArray(claims.roles);
  resultados.push({
    ok: okClaims,
    nome: 'JWT: RS256, iss, aud, sub numérico e roles',
    metodo: '-',
    url: '-',
    status: JSON.stringify({ ...cab, ...claims }).slice(0, 160),
  });
}
const tk = login.json?.accessToken ?? token;
await req(
  'BUG API: /usuarios/me com o próprio token deveria ser 200',
  'GET',
  `${J}/api/v1/usuarios/me`,
  { token: tk },
);
await req('/usuarios/me sem token', 'GET', `${J}/api/v1/usuarios/me`, { esperado: 401 });
await req(
  'orientações públicas da ocorrência',
  'GET',
  `${J}/api/v1/ia/orientacoes/ocorrencias/21?page=0&size=10`,
);
await req(
  'BUG API: pedir orientação com o próprio token deveria ser 200/201/202',
  'POST',
  `${J}/api/v1/ia/orientacoes`,
  {
    token: tk,
    body: { ocorrenciaId: '21' },
    esperado: [200, 201, 202],
  },
);
await req('pedir orientação sem token', 'POST', `${J}/api/v1/ia/orientacoes`, {
  body: { ocorrenciaId: '21' },
  esperado: 401,
});

// CORS (Expo Web roda no navegador)
const cors = await req(
  'BUG API: CORS preflight para http://localhost:8081 deveria ser 200/204',
  'OPTIONS',
  `${J}/api/v1/auth/login`,
  {
    headers: {
      Origin: 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
    esperado: [200, 204],
  },
);
void cors;

// Integração Java → .NET
await req('.NET valida a assinatura do JWT Java (não 401)', 'GET', `${N}/api/ocorrencias/minhas`, {
  token: tk,
  esperado: [200, 403],
});
await req(
  'BUG INTEGRAÇÃO: usuário criado no Java deveria existir na .NET',
  'GET',
  `${N}/api/ocorrencias/minhas`,
  {
    token: tk,
    esperado: 200,
  },
);

// CRUD do próprio usuário (por último: o DELETE desativa a conta de teste)
const novoNome = 'Teste App Editado';
const pat = await req('CRUD: editar nome (PATCH /usuarios/me)', 'PATCH', `${J}/api/v1/usuarios/me`, {
  token: tk,
  body: { nome: novoNome },
});
const me2 = await req('CRUD: ler perfil depois de editar', 'GET', `${J}/api/v1/usuarios/me`, {
  token: tk,
});
resultados.push({
  ok: pat.json?.nome === novoNome && me2.json?.nome === novoNome,
  nome: 'CRUD: nome novo salvo',
  metodo: '-',
  url: '-',
  status: String(me2.json?.nome),
});
await req('CRUD: editar com nome vazio', 'PATCH', `${J}/api/v1/usuarios/me`, {
  token: tk,
  body: { nome: '' },
  esperado: 400,
});
await req('CRUD: excluir conta (DELETE /usuarios/me)', 'DELETE', `${J}/api/v1/usuarios/me`, {
  token: tk,
  esperado: [200, 204],
});
await req('CRUD: login depois de excluir', 'POST', `${J}/api/v1/auth/login`, {
  body: { email, senha },
  esperado: [401, 403],
});

console.log('\n=== RESULTADOS (API Java) ===');
for (const r of resultados)
  console.log(
    `${r.ok ? 'OK   ' : 'FALHA'} ${String(r.status).padEnd(4)} ${r.metodo} ${r.url} — ${r.nome}${r.ok ? '' : ` | esperado ${r.esperado} | ${r.resumo}`}`,
  );
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} ok`);
if (falhas.some((r) => !/^BUG/.test(r.nome))) process.exitCode = 1;
