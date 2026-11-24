// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Proxy da API Java no servidor de desenvolvimento (`npx expo start`).
 *
 * A API Java publicada não envia cabeçalhos CORS (o preflight responde 403 para
 * qualquer origem), então o navegador bloqueia as chamadas diretas do Expo Web.
 * O app no navegador chama /api-java/api/v1/... na mesma origem e este middleware
 * repassa para a API. No celular o app chama a API Java direto (sem CORS).
 * Só caminhos /api/v1/** são aceitos.
 */
const API_JAVA_URL =
  process.env.API_JAVA_URL ?? 'https://bairro-vivo-java-566385.azurewebsites.net';
const PREFIXO = '/api-java';
const CABECALHOS = ['authorization', 'content-type', 'accept', 'idempotency-key'];

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    req.on('data', (p) => partes.push(p));
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

async function proxyJava(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const caminho = url.pathname.slice(PREFIXO.length);
  const responder = (status, corpo) => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(corpo));
  };
  if (!/^\/api\/v1\/[A-Za-z0-9/_.-]*$/.test(caminho)) {
    return responder(400, {
      codigo: 'ROTA_INVALIDA',
      mensagem: 'Caminho não permitido.',
      detalhes: [],
    });
  }
  const headers = {};
  for (const nome of CABECALHOS) if (req.headers[nome]) headers[nome] = req.headers[nome];
  try {
    const temCorpo = !['GET', 'HEAD'].includes(req.method);
    const resposta = await fetch(`${API_JAVA_URL}${caminho}${url.search}`, {
      method: req.method,
      headers,
      body: temCorpo ? await lerCorpo(req) : undefined,
    });
    res.statusCode = resposta.status;
    res.setHeader('content-type', resposta.headers.get('content-type') ?? 'application/json');
    res.end(Buffer.from(await resposta.arrayBuffer()));
  } catch {
    responder(502, {
      codigo: 'JAVA_INDISPONIVEL',
      mensagem: 'Não conseguimos falar com a API Java.',
      detalhes: [],
    });
  }
}

const enhanceOriginal = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const anterior = enhanceOriginal ? enhanceOriginal(middleware, server) : middleware;
    return (req, res, next) => {
      if (req.url && req.url.startsWith(`${PREFIXO}/`)) {
        proxyJava(req, res);
        return;
      }
      return anterior(req, res, next);
    };
  },
};

module.exports = config;
