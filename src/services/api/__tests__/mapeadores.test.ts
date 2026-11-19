import {
  atualizacaoDoApp,
  autorDoApp,
  erroDaApi,
  historicoDoApp,
  iconeDaApi,
  iconeDoApp,
  normalizarData,
  ocorrenciaDoApp,
  OcorrenciaDto,
} from '../mapeadores';

// Amostra real de GET /api/ocorrencias/{id} (API .NET publicada).
const dto: OcorrenciaDto = {
  id: '21',
  titulo: 'Buraco profundo na faixa da direita',
  descricao: 'Buraco de grandes proporções.',
  status: 'RESOLVIDA',
  numeroCiclo: 2,
  categoria: {
    id: '1',
    nome: 'Buracos e pavimentacao',
    descricao: 'Danos na pavimentacao',
    icone: 'construction',
    ativa: true,
  },
  municipio: { id: '1', codigoIbge: 3550308, nome: 'Sao Paulo', uf: 'SP' },
  latitude: -23.561684,
  longitude: -46.655981,
  enderecoReferencia: 'Avenida Paulista, 1000',
  autorExibicao: 'Ana Demo',
  anonimoPublico: false,
  dtCriacao: '2026-11-18T01:12:21.922128',
  dtAtualizacao: '2026-11-18T17:11:10.9500041Z',
  midias: [{ id: '7', urlExibicao: 'https://example.org/1.jpg', mimeType: 'image/jpeg' }],
  totalVotosCiclo: 0,
};

describe('normalizarData', () => {
  it('trata datas sem fuso como horário de Brasília', () => {
    expect(normalizarData('2026-11-18T14:11:27.814037')).toBe('2026-11-18T17:11:27.814Z');
  });
  it('detecta a data gravada em UTC sem fuso (cairia no futuro)', () => {
    const agora = Date.parse('2026-11-18T17:26:00Z');
    expect(normalizarData('2026-11-18T17:24:08.797086', agora)).toBe('2026-11-18T17:24:08.797Z');
    expect(normalizarData('2026-11-18T14:24:41.357269', agora)).toBe('2026-11-18T17:24:41.357Z');
  });
  it('mantém datas com Z', () => {
    expect(normalizarData('2026-11-18T17:11:10.9500041Z')).toBe('2026-11-18T17:11:10.950Z');
  });
});

describe('ícones e autor', () => {
  it('converte os ícones lucide da API e volta', () => {
    expect(iconeDoApp('construction')).toBe('buraco');
    expect(iconeDoApp('trash-2')).toBe('lixo');
    expect(iconeDoApp('desconhecido')).toBe('desconhecido');
    expect(iconeDaApi('iluminacao')).toBe('lightbulb');
  });
  it('acentua "Cidadão anônimo"', () => {
    expect(autorDoApp('Cidadao anonimo', true)).toBe('Cidadão anônimo');
    expect(autorDoApp('Ana Demo', false)).toBe('Ana Demo');
  });
});

describe('ocorrenciaDoApp', () => {
  it('mapeia o DTO para o modelo do app', () => {
    const o = ocorrenciaDoApp(dto, '1');
    expect(o).toEqual(
      expect.objectContaining({
        id: '21',
        status: 'RESOLVIDA',
        numeroCiclo: 2,
        idAutor: '1',
        excluida: false,
        dtCriacao: '2026-11-18T04:12:21.922Z',
      }),
    );
    expect(o.categoria.icone).toBe('buraco');
    expect(o.municipio.codigoIbge).toBe(3550308);
    expect(o.midias[0]).toEqual(expect.objectContaining({ id: '7', principal: true }));
  });
});

describe('atualizacaoDoApp e historicoDoApp', () => {
  it('usa a primeira mídia como foto de evidência', () => {
    const a = atualizacaoDoApp({
      id: '20',
      idOcorrencia: '22',
      tipo: 'RESOLVIDO',
      autorExibicao: 'Cidadao anonimo',
      anonimoPublico: true,
      contabilizadaComoVoto: true,
      statusAtual: 'ABERTA',
      numeroCiclo: 1,
      dtCriacao: '2026-11-18T14:11:33.138238',
      midias: [{ id: '9', urlExibicao: 'https://example.org/ev.jpg' }],
    });
    expect(a.tipo).toBe('RESOLVIDO');
    expect(a.autorExibicao).toBe('Cidadão anônimo');
    expect(a.urlFotoEvidencia).toBe('https://example.org/ev.jpg');
  });

  it('mantém só as mudanças de status, em ordem', () => {
    const h = historicoDoApp([
      {
        id: '15',
        idOcorrencia: '22',
        operacao: 'UPDATE',
        statusAnterior: 'ABERTA',
        statusNovo: 'RESOLVIDA',
        cicloAnterior: 1,
        cicloNovo: 2,
        dtEvento: '2026-11-18T14:11:37',
      },
      {
        id: '13',
        idOcorrencia: '22',
        operacao: 'INSERT',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        cicloAnterior: null,
        cicloNovo: 1,
        dtEvento: '2026-11-18T14:11:11',
      },
      {
        id: '14',
        idOcorrencia: '22',
        operacao: 'INSERT',
        statusAnterior: 'ABERTA',
        statusNovo: 'ABERTA',
        cicloAnterior: 1,
        cicloNovo: 1,
        dtEvento: '2026-11-18T14:11:20',
      },
    ]);
    expect(h).toHaveLength(1);
    expect(h[0]).toEqual(
      expect.objectContaining({ statusAnterior: 'ABERTA', statusNovo: 'RESOLVIDA', cicloNovo: 2 }),
    );
  });
});

describe('erroDaApi', () => {
  it('leva os erros do ModelState para os campos do formulário', () => {
    const e = erroDaApi(400, {
      mensagem: 'Dados inválidos.',
      erros: {
        Titulo: ['Título muito curto'],
        Latitude: ['Fora do intervalo'],
        CategoriaId: ['Obrigatório'],
      },
    });
    expect(e.status).toBe(400);
    expect(e.campos).toEqual({
      titulo: 'Título muito curto',
      local: 'Fora do intervalo',
      idCategoria: 'Obrigatório',
    });
  });
  it('usa a mensagem da API e nunca expõe erro interno', () => {
    expect(erroDaApi(403, { mensagem: 'Sem permissão para alterar.' }).mensagem).toBe(
      'Sem permissão para alterar.',
    );
    expect(erroDaApi(500, { mensagem: 'Erro interno da API.' }).mensagem).toMatch(/conectar/);
    expect(erroDaApi(502, null).status).toBe(500);
    expect(erroDaApi(429, null).mensagem).toMatch(/Espere um minuto/);
  });
});
