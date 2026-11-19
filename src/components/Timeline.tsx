import { ArrowRight, MessageSquare, TriangleAlert } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';

import type { Atualizacao, HistoricoStatus, Ocorrencia } from '@/models';
import { colors, fonts } from '@/theme';
import { tempoRelativo } from '@/utils/format';

import { CheckMark, StatusChip } from './StatusChip';

type Item =
  | { tipo: 'atualizacao'; data: string; a: Atualizacao }
  | { tipo: 'status'; data: string; h: HistoricoStatus };

function Marcador({ item }: { item: Item }) {
  if (item.tipo === 'status') {
    const resolvida = item.h.statusNovo === 'RESOLVIDA';
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: resolvida ? colors.verde : colors.sinal,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {resolvida ? (
          <CheckMark size={16} color={colors.superficie} strokeWidth={2.6} />
        ) : (
          <TriangleAlert size={15} color={colors.superficie} strokeWidth={2.2} />
        )}
      </View>
    );
  }
  const { a } = item;
  if (a.tipo === 'RESOLVIDO')
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.broto,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckMark size={16} strokeWidth={2.4} />
      </View>
    );
  if (a.tipo === 'PERSISTE')
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.sinalClaro,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TriangleAlert size={15} color={colors.sinalEscuro} strokeWidth={2} />
      </View>
    );
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.calcada,
        borderWidth: 1,
        borderColor: colors.linha,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MessageSquare size={15} color={colors.asfalto} strokeWidth={2} />
    </View>
  );
}

function verbo(a: Atualizacao): string {
  if (a.tipo === 'RESOLVIDO') return 'disse que foi resolvido';
  if (a.tipo === 'PERSISTE') return 'disse que ainda continua';
  return 'comentou';
}

function rodape(a: Atualizacao): { texto: string; cor: string } | null {
  if (a.tipo === 'COMENTARIO') return null;
  if (a.contabilizadaComoVoto) {
    return a.tipo === 'RESOLVIDO'
      ? { texto: 'Contou como confirmação', cor: colors.verdeEscuro }
      : { texto: 'Contou como confirmação para reabrir', cor: colors.sinalEscuro };
  }
  return { texto: 'Registrado como evidência', cor: colors.concreto };
}

/** Histórico da ocorrência: atualizações, mudanças de status e o registro inicial. */
export function Timeline({
  ocorrencia,
  atualizacoes,
  historico,
  idUsuario,
}: {
  ocorrencia: Ocorrencia;
  atualizacoes: Atualizacao[];
  historico: HistoricoStatus[];
  idUsuario?: string;
}) {
  const itens: Item[] = [
    ...atualizacoes.map((a) => ({ tipo: 'atualizacao' as const, data: a.dtCriacao, a })),
    ...historico.map((h) => ({ tipo: 'status' as const, data: h.dtEvento, h })),
  ].sort((x, y) => {
    const d = y.data.localeCompare(x.data);
    // No mesmo instante, a mudança de status aparece acima do voto que a causou.
    if (d === 0) return x.tipo === 'status' ? -1 : 1;
    return d;
  });

  return (
    <View style={{ gap: 0 }}>
      {itens.map((item) => (
        <View
          // Ids de atualização e de histórico vêm de tabelas diferentes e podem coincidir.
          key={item.tipo === 'status' ? `h-${item.h.id}` : `a-${item.a.id}`}
          style={{ flexDirection: 'row', gap: 12 }}
        >
          <View style={{ alignItems: 'center' }}>
            <Marcador item={item} />
            <View style={{ width: 2, flex: 1, backgroundColor: colors.linha }} />
          </View>
          {item.tipo === 'status' ? (
            <View style={{ flex: 1, paddingTop: 4, paddingBottom: 16, gap: 6 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
              >
                <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>
                  {item.h.statusNovo === 'RESOLVIDA'
                    ? 'Resolvida pela comunidade'
                    : 'Reaberta pela comunidade'}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
                  {tempoRelativo(item.h.dtEvento)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.h.statusAnterior ? <StatusChip status={item.h.statusAnterior} plain /> : null}
                <ArrowRight size={14} color={colors.concreto} strokeWidth={2} />
                <StatusChip status={item.h.statusNovo} plain />
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
                  ciclo {item.h.cicloAnterior} → {item.h.cicloNovo}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.superficie,
                borderWidth: 1,
                borderColor: colors.linha,
                borderRadius: 16,
                padding: 14,
                gap: 6,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text
                  style={{ flex: 1, fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}
                >
                  {item.a.autorExibicao} · {verbo(item.a)}
                  {idUsuario && item.a.idAutor === idUsuario ? (
                    <Text style={{ fontFamily: fonts.regular, color: colors.concreto }}>
                      {' '}
                      (você)
                    </Text>
                  ) : null}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
                  {tempoRelativo(item.a.dtCriacao)}
                </Text>
              </View>
              {item.a.texto ? (
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    lineHeight: 21,
                    color: colors.asfalto,
                  }}
                >
                  {item.a.texto}
                </Text>
              ) : null}
              {item.a.urlFotoEvidencia ? (
                <Image
                  source={{ uri: item.a.urlFotoEvidencia }}
                  accessibilityLabel="Foto de evidência"
                  style={{ width: '100%', height: 140, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : null}
              {rodape(item.a) ? (
                <Text style={{ fontFamily: fonts.semi, fontSize: 12, color: rodape(item.a)?.cor }}>
                  {rodape(item.a)?.texto}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.sinalClaro,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sinal }} />
        </View>
        <View style={{ flex: 1, paddingVertical: 6, gap: 2 }}>
          <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>
            Ocorrência registrada
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
            {tempoRelativo(ocorrencia.dtCriacao)}
          </Text>
        </View>
      </View>
    </View>
  );
}
