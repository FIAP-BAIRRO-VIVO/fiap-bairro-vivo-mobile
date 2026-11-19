import { Download, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  DarkBadge,
  EmptyState,
  ErrorState,
  FilterSelect,
  GradientView,
  SkeletonList,
  StickerShadow,
  TitleHighlight,
  useToast,
  tituloDoErro,
} from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import { useCatalogo } from '@/hooks/useCatalogo';
import type { RelatorioLinha, StatusOcorrencia } from '@/models';
import { relatorioService } from '@/services';
import { colors, fonts, GradientSpec } from '@/theme';

const ESCURO: GradientSpec = { colors: ['#2E3A36', '#1C2321'], angle: 145 };

function Total({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom: 'total' | 'aberta' | 'resolvida';
}) {
  const fg =
    tom === 'total' ? colors.calcada : tom === 'aberta' ? colors.sinalEscuro : colors.verdeEscuro;
  const apoio = tom === 'total' ? colors.textoSobreEscuro : fg;
  const conteudo = (
    <>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: apoio }}>{rotulo}</Text>
      <Text style={{ fontFamily: fonts.tituloForte, fontSize: 30, color: fg }}>{valor}</Text>
    </>
  );
  const caixa = { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, gap: 2 };
  if (tom === 'total') {
    return (
      <StickerShadow offset={3} radius={16} color={colors.sinal} style={{ flex: 1 }}>
        <GradientView gradient={ESCURO} style={caixa}>
          {conteudo}
        </GradientView>
      </StickerShadow>
    );
  }
  return (
    <View
      style={[
        caixa,
        { flex: 1, backgroundColor: tom === 'aberta' ? colors.sinalClaro : colors.broto },
      ]}
    >
      {conteudo}
    </View>
  );
}

interface Agrupado {
  nome: string;
  abertas: number;
  resolvidas: number;
}

function agrupar(linhas: RelatorioLinha[], chave: 'categoria' | 'municipio'): Agrupado[] {
  const mapa = new Map<string, Agrupado>();
  for (const l of linhas) {
    const id = chave === 'categoria' ? l.idCategoria : l.idMunicipio;
    const nome = chave === 'categoria' ? l.nomeCategoria : `${l.nomeMunicipio} · ${l.uf}`;
    const g = mapa.get(id) ?? { nome, abertas: 0, resolvidas: 0 };
    if (l.status === 'ABERTA') g.abertas += l.totalOcorrencias;
    else g.resolvidas += l.totalOcorrencias;
    mapa.set(id, g);
  }
  return [...mapa.values()].sort(
    (a, b) => b.abertas + b.resolvidas - (a.abertas + a.resolvidas) || a.nome.localeCompare(b.nome),
  );
}

function exportarCsv(linhas: RelatorioLinha[]): boolean {
  const cabecalho = 'municipio;uf;categoria;situacao;total';
  const corpo = linhas.map((l) =>
    [l.nomeMunicipio, l.uf, l.nomeCategoria, l.status, l.totalOcorrencias].join(';'),
  );
  const csv = '﻿' + [cabecalho, ...corpo].join('\n');
  if (Platform.OS !== 'web') return false;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bairro-vivo-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Relatórios ADMIN: só números agregados, sem dados pessoais e sem moderação. */
export default function Relatorios() {
  const toast = useToast();
  const { categorias, municipios } = useCatalogo(true);
  const [municipioId, setMunicipioId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [status, setStatus] = useState<'' | StatusOcorrencia>('');

  const { dados, erro, carregando, recarregar } = useCarregar(
    () =>
      relatorioService.ocorrencias({
        municipioId: municipioId || undefined,
        categoriaId: categoriaId || undefined,
        status: status || undefined,
      }),
    [municipioId, categoriaId, status],
  );

  const linhas = dados ?? [];
  const abertas = linhas
    .filter((l) => l.status === 'ABERTA')
    .reduce((s, l) => s + l.totalOcorrencias, 0);
  const resolvidas = linhas
    .filter((l) => l.status === 'RESOLVIDA')
    .reduce((s, l) => s + l.totalOcorrencias, 0);
  const porCategoria = agrupar(linhas, 'categoria');
  // Todos os municípios do catálogo aparecem na tabela, mesmo com zero.
  const agrupadoMunicipio = agrupar(linhas, 'municipio');
  const porMunicipio = municipios
    .filter((m) => !municipioId || m.id === municipioId)
    .map(
      (m) =>
        agrupadoMunicipio.find((g) => g.nome === `${m.nome} · ${m.uf}`) ?? {
          nome: `${m.nome} · ${m.uf}`,
          abertas: 0,
          resolvidas: 0,
        },
    )
    .sort((a, b) => b.abertas + b.resolvidas - (a.abertas + a.resolvidas));
  const maior = Math.max(1, ...porCategoria.map((g) => g.abertas + g.resolvidas));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8, gap: 12 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <TitleHighlight>Relatórios</TitleHighlight>
            <DarkBadge>ADMIN · SÓ LEITURA</DarkBadge>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterSelect
              title="Município"
              placeholder="Município"
              value={municipioId}
              emptyValue=""
              onChange={setMunicipioId}
              options={[
                { value: '', label: 'Todos os municípios' },
                ...municipios.map((m) => ({ value: m.id, label: m.nome })),
              ]}
            />
            <FilterSelect
              title="Categoria"
              placeholder="Categoria"
              value={categoriaId}
              emptyValue=""
              onChange={setCategoriaId}
              options={[
                { value: '', label: 'Todas as categorias' },
                ...categorias.map((c) => ({ value: c.id, label: c.nome })),
              ]}
            />
            <FilterSelect
              title="Situação"
              placeholder="Situação"
              value={status}
              emptyValue=""
              onChange={setStatus}
              options={[
                { value: '', label: 'Todas' },
                { value: 'ABERTA', label: 'Abertas' },
                { value: 'RESOLVIDA', label: 'Resolvidas' },
              ]}
            />
          </View>
        </View>

        <View style={{ paddingTop: 8, paddingHorizontal: 20, gap: 16 }}>
          {carregando ? (
            <SkeletonList count={3} />
          ) : erro ? (
            <ErrorState
              title={tituloDoErro(erro)}
              message={erro.mensagem}
              action={{ label: 'Tentar de novo', onPress: recarregar }}
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Total rotulo="Total" valor={abertas + resolvidas} tom="total" />
                <Total rotulo="Abertas" valor={abertas} tom="aberta" />
                <Total rotulo="Resolvidas" valor={resolvidas} tom="resolvida" />
              </View>

              {linhas.length === 0 ? (
                <EmptyState
                  title="Nenhuma ocorrência com esses filtros"
                  message="Mude o município, a categoria ou a situação."
                />
              ) : (
                <>
                  <View
                    style={{
                      backgroundColor: colors.superficie,
                      borderWidth: 1,
                      borderColor: colors.linha,
                      borderRadius: 20,
                      padding: 18,
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <Text
                        style={{ fontFamily: fonts.titulo, fontSize: 18, color: colors.asfalto }}
                      >
                        Por categoria
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {[
                          ['Abertas', colors.sinal],
                          ['Resolvidas', colors.verde],
                        ].map(([r, c]) => (
                          <View
                            key={r}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <View
                              style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }}
                            />
                            <Text
                              style={{
                                fontFamily: fonts.regular,
                                fontSize: 12,
                                color: colors.concreto,
                              }}
                            >
                              {r}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {porCategoria.map((g) => {
                      const total = g.abertas + g.resolvidas;
                      return (
                        <View
                          key={g.nome}
                          style={{ gap: 4 }}
                          accessibilityLabel={`${g.nome}: ${g.abertas} abertas e ${g.resolvidas} resolvidas`}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text
                              style={{
                                fontFamily: fonts.semi,
                                fontSize: 13,
                                color: colors.asfalto,
                              }}
                            >
                              {g.nome}
                            </Text>
                            <Text
                              style={{
                                fontFamily: fonts.regular,
                                fontSize: 13,
                                color: colors.concreto,
                              }}
                            >
                              {g.abertas} · {g.resolvidas}
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 12,
                              flexDirection: 'row',
                              gap: 2,
                              width: `${(total / maior) * 100}%`,
                            }}
                          >
                            {g.abertas > 0 ? (
                              <View
                                style={{
                                  flex: g.abertas,
                                  borderRadius: 4,
                                  backgroundColor: colors.sinal,
                                }}
                              />
                            ) : null}
                            {g.resolvidas > 0 ? (
                              <View
                                style={{
                                  flex: g.resolvidas,
                                  borderRadius: 4,
                                  backgroundColor: colors.verde,
                                }}
                              />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.superficie,
                      borderWidth: 1,
                      borderColor: colors.linha,
                      borderRadius: 20,
                      padding: 18,
                      gap: 10,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.titulo, fontSize: 18, color: colors.asfalto }}>
                      Por município
                    </Text>
                    <View accessibilityRole="list">
                      <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: fonts.semi,
                            fontSize: 12,
                            color: colors.concreto,
                          }}
                        >
                          Município
                        </Text>
                        <Text
                          style={{
                            width: 70,
                            textAlign: 'right',
                            fontFamily: fonts.semi,
                            fontSize: 12,
                            color: colors.concreto,
                          }}
                        >
                          Abertas
                        </Text>
                        <Text
                          style={{
                            width: 84,
                            textAlign: 'right',
                            fontFamily: fonts.semi,
                            fontSize: 12,
                            color: colors.concreto,
                          }}
                        >
                          Resolvidas
                        </Text>
                      </View>
                      {porMunicipio.map((g) => (
                        <View
                          key={g.nome}
                          style={{
                            flexDirection: 'row',
                            paddingVertical: 10,
                            borderTopWidth: 1,
                            borderTopColor: colors.linha,
                          }}
                        >
                          <Text
                            style={{
                              flex: 1,
                              fontFamily: fonts.semi,
                              fontSize: 14,
                              color: colors.asfalto,
                            }}
                          >
                            {g.nome}
                          </Text>
                          <Text
                            style={{
                              width: 70,
                              textAlign: 'right',
                              fontFamily: fonts.regular,
                              fontSize: 14,
                              color: colors.asfalto,
                            }}
                          >
                            {g.abertas}
                          </Text>
                          <Text
                            style={{
                              width: 84,
                              textAlign: 'right',
                              fontFamily: fonts.regular,
                              fontSize: 14,
                              color: colors.asfalto,
                            }}
                          >
                            {g.resolvidas}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <ShieldCheck size={18} color={colors.concreto} strokeWidth={1.8} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.regular,
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.concreto,
                  }}
                >
                  Só números agregados. Nenhum nome ou email aparece aqui, e o perfil ADMIN não muda
                  a situação de nenhuma ocorrência.
                </Text>
              </View>
              <Button
                title="Exportar CSV"
                variant="outline"
                height={48}
                fontSize={14}
                icon={<Download size={18} color={colors.asfalto} strokeWidth={2} />}
                disabled={linhas.length === 0}
                onPress={() => {
                  if (exportarCsv(linhas)) toast.show('Relatório exportado em CSV.');
                  else toast.show('A exportação em CSV está disponível na versão web.', 'info');
                }}
                style={{ backgroundColor: 'transparent' }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
