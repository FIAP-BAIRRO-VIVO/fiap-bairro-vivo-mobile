import {
  base64UrlParaTexto,
  erroDaJava,
  expiracaoDoJwt,
  orientacaoDaJava,
  perfilDaJava,
} from '../mapeadoresJava';

// JWT real emitido por POST /api/v1/auth/registrar, com a assinatura trocada.
// Payload: { sub: "7", aud: "bairro-vivo-apis", roles: ["CIDADAO"], iss: "bairro-vivo-java", exp: 1795059544 }
const jwt =
  'eyJraWQiOiJiYWlycm8tdml2by1yc2EtMSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI3IiwiYXVkIjoiYmFpcnJvLXZpdm8tYXBpcyIsInJvbGVzIjpbIkNJREFEQU8iXSwiaXNzIjoiYmFpcnJvLXZpdm8tamF2YSIsImV4cCI6MTc5NTA1OTU0NCwiaWF0IjoxNzk1MDU1OTQ0fQ.assinatura';

describe('JWT da API Java', () => {
  it('decodifica base64url sem atob/Buffer', () => {
    expect(JSON.parse(base64UrlParaTexto(jwt.split('.')[1])).sub).toBe('7');
  });
  it('usa o exp do token como expiração da sessão', () => {
    expect(expiracaoDoJwt(jwt)).toBe(new Date(1795059544 * 1000).toISOString());
  });
  it('cai para expiresIn quando o token não tem exp legível', () => {
    expect(expiracaoDoJwt('x.y.z', 3600, Date.parse('2026-11-18T00:00:00Z'))).toBe(
      '2026-11-18T01:00:00.000Z',
    );
  });
});

describe('perfilDaJava', () => {
  it('lê "papel" (formato da API) e "papeis" (formato do contrato)', () => {
    expect(perfilDaJava({ id: '6', nome: 'A', email: 'a@b.c', papel: 'CIDADAO' })).toBe('CIDADAO');
    expect(perfilDaJava({ id: '5', nome: 'A', email: 'a@b.c', papeis: ['ROLE_ADMIN'] })).toBe(
      'ADMIN',
    );
  });
});

describe('erroDaJava', () => {
  it('leva os detalhes de validação para os campos, em português', () => {
    const e = erroDaJava(400, {
      codigo: 'VALIDACAO_INVALIDA',
      mensagem: 'Confira os dados informados.',
      detalhes: [
        { campo: 'senha', mensagem: 'must not be blank' },
        { campo: 'email', mensagem: 'must be a well-formed email address' },
      ],
    });
    expect(e.status).toBe(400);
    expect(e.campos).toEqual({
      senha: 'Preencha este campo.',
      email: 'Digite um email válido, como nome@dominio.com',
    });
  });
  it('trata email repetido e credenciais inválidas', () => {
    const dup = erroDaJava(409, { codigo: 'EMAIL_JA_CADASTRADO', mensagem: 'Ja existe' });
    expect(dup.campos?.email).toMatch(/já tem conta/);
    expect(erroDaJava(401, { codigo: 'CREDENCIAIS_INVALIDAS' }).mensagem).toBe(
      'Email ou senha não conferem.',
    );
  });
  it('não expõe erro interno', () => {
    expect(erroDaJava(500, { codigo: 'ERRO_INTERNO', mensagem: 'stack' }).mensagem).toMatch(
      /API Java/,
    );
  });
});

describe('orientacaoDaJava', () => {
  it('mapeia a resposta da IA e descarta fontes sem URL', () => {
    const o = orientacaoDaJava({
      id: 501,
      ocorrenciaId: 21,
      estado: 'disponivel',
      orgaoResponsavel: 'Subprefeitura',
      canais: [
        { tipo: 'TELEFONE', valor: '156' },
        { tipo: 'FAX', valor: 'x' },
      ],
      fontes: [
        { titulo: 'SP156', url: 'https://sp156.prefeitura.sp.gov.br', verificadaEm: '2026-11-10' },
        { titulo: 'Sem link', url: '' },
      ],
    });
    expect(o.id).toBe('501');
    expect(o.estado).toBe('DISPONIVEL');
    expect(o.canais[1].tipo).toBe('OUTRO');
    expect(o.fontes).toHaveLength(1);
    expect(o.origem).toBe('IA_JAVA');
  });
  it('estado desconhecido vira ERRO', () => {
    expect(orientacaoDaJava({ id: 1, ocorrenciaId: 1, estado: '???' }).estado).toBe('ERRO');
  });
});
