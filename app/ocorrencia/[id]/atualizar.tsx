import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppBar,
  Button,
  Checkbox,
  ErrorState,
  FormField,
  Miniatura,
  Notice,
  PhotoBox,
  Protegida,
  SkeletonList,
  StatusChip,
  useToast,
  tituloDoErro,
} from '@/components';
import { contaComoVoto } from '@/domain/atualizacaoRules';
import { useCarregar } from '@/hooks/useCarregar';
import type { ErroServico, FotoInput, Ocorrencia, TipoAtualizacao } from '@/models';
import {
  atualizacaoService,
  MENSAGENS,
  ocorrenciaService,
  paraErroServico,
  recursos,
} from '@/services';
import { colors, fonts } from '@/theme';
import { escolherFoto } from '@/utils/fotos';

const TIPOS: TipoAtualizacao[] = ['RESOLVIDO', 'PERSISTE', 'COMENTARIO'];

function textoOpcao(tipo: TipoAtualizacao, o: Ocorrencia, jaVotei: boolean): string {
  const voto = contaComoVoto(tipo, o.status);
  if (voto && jaVotei) return 'Você já confirmou neste ciclo. Agora falta outro vizinho.';
  if (tipo === 'COMENTARIO') return 'Um comentário ou foto. Não muda a situação.';
  if (tipo === 'RESOLVIDO') {
    if (!voto)
      return 'Ela já está resolvida. Sua atualização vira evidência, sem contar como voto.';
    return o.totalVotosCiclo >= 1
      ? 'Conta como voto. Já tem 1 confirmação; com a sua, a ocorrência vira RESOLVIDA.'
      : 'Conta como voto. Com a sua e a de mais um vizinho, a ocorrência vira RESOLVIDA.';
  }
  if (!voto)
    return 'Enquanto está aberta, vira prova de que o problema persiste. Depois de resolvida, conta como voto para reabrir.';
  return o.totalVotosCiclo >= 1
    ? 'Conta como voto para reabrir. Já tem 1 confirmação; com a sua, ela volta a ficar ABERTA.'
    : 'Conta como voto para reabrir. Com a sua e a de mais um vizinho, ela volta a ficar ABERTA.';
}

const ROTULOS: Record<TipoAtualizacao, string> = {
  RESOLVIDO: 'Foi resolvido',
  PERSISTE: 'Ainda continua',
  COMENTARIO: 'Informação adicional',
};

const ESTILO_SELECIONADO: Record<TipoAtualizacao, { bg: string; borda: string; texto: string }> = {
  RESOLVIDO: { bg: colors.broto, borda: colors.verde, texto: colors.verdeEscuro },
  PERSISTE: { bg: colors.sinalClaro, borda: colors.sinal, texto: colors.sinalEscuro },
  COMENTARIO: { bg: colors.areia, borda: colors.asfalto, texto: colors.asfalto },
};

function OpcaoTipo({
  tipo,
  selecionado,
  desabilitado,
  descricao,
  onPress,
}: {
  tipo: TipoAtualizacao;
  selecionado: boolean;
  desabilitado: boolean;
  descricao: string;
  onPress: () => void;
}) {
  const s = ESTILO_SELECIONADO[tipo];
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionado, disabled: desabilitado }}
      accessibilityLabel={`${ROTULOS[tipo]}. ${descricao}`}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        backgroundColor: selecionado ? s.bg : colors.superficie,
        borderWidth: selecionado ? 2 : 1.5,
        borderColor: selecionado ? s.borda : colors.linha,
        borderRadius: 16,
        padding: 14,
        opacity: desabilitado ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 2,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selecionado ? s.borda : colors.concreto,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selecionado ? (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.borda }} />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontFamily: fonts.negrito,
            fontSize: 15,
            color: selecionado ? s.texto : colors.asfalto,
          }}
        >
          {ROTULOS[tipo]}
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            color: selecionado ? s.texto : colors.concreto,
          }}
        >
          {descricao}
        </Text>
      </View>
    </Pressable>
  );
}

function Atualizar() {
  const { id, tipo: tipoParam } = useLocalSearchParams<{ id: string; tipo?: string }>();
  const router = useRouter();
  const toast = useToast();
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [ocorrencia, jaVotei] = await Promise.all([
      ocorrenciaService.obter(id),
      atualizacaoService.jaVotei(id),
    ]);
    return { ocorrencia, jaVotei };
  }, [id]);

  const inicial = TIPOS.includes(tipoParam as TipoAtualizacao)
    ? (tipoParam as TipoAtualizacao)
    : 'COMENTARIO';
  const [tipo, setTipo] = useState<TipoAtualizacao>(inicial);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<FotoInput | undefined>();
  const [anonimo, setAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroTexto, setErroTexto] = useState<string | undefined>();
  const [erroGeral, setErroGeral] = useState<ErroServico | null>(null);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace(`/ocorrencia/${id}`));

  if (carregando) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada, padding: 20 }}>
        <SkeletonList count={2} />
      </SafeAreaView>
    );
  }
  if (erro || !dados) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <ErrorState
          title={tituloDoErro(erro)}
          message={erro?.mensagem ?? 'Tente de novo.'}
          action={
            erro?.status === 404
              ? { label: 'Voltar ao mapa', onPress: () => router.replace('/'), variant: 'outline' }
              : { label: 'Tentar de novo', onPress: recarregar }
          }
        />
      </SafeAreaView>
    );
  }

  const { ocorrencia: o, jaVotei } = dados;
  const bloqueado = (t: TipoAtualizacao) => jaVotei && contaComoVoto(t, o.status);
  // Se a opção que veio pela rota já foi votada, cai para "Informação adicional".
  const tipoEfetivo = bloqueado(tipo) ? 'COMENTARIO' : tipo;

  const adicionarFoto = async () => {
    try {
      const f = await escolherFoto();
      if (f) {
        setFoto(f);
        setErroTexto(undefined);
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Não foi possível abrir as fotos.', 'aviso');
    }
  };

  const enviar = async () => {
    setErroGeral(null);
    if (tipoEfetivo === 'COMENTARIO' && !texto.trim() && !foto) {
      setErroTexto('Escreva um comentário ou adicione uma foto.');
      return;
    }
    setEnviando(true);
    try {
      const r = await atualizacaoService.enviar(o.id, {
        tipo: tipoEfetivo,
        texto,
        foto,
        anonimoPublico: anonimo,
      });
      if (r.historico) {
        router.replace({
          pathname: '/ocorrencia/[id]/resolvida',
          params: {
            id: o.id,
            de: r.historico.statusAnterior ?? o.status,
            para: r.historico.statusNovo,
            cicloDe: String(r.historico.cicloAnterior ?? o.numeroCiclo),
            cicloPara: String(r.historico.cicloNovo),
          },
        });
        return;
      }
      toast.show(
        r.atualizacao.contabilizadaComoVoto
          ? 'Confirmação registrada. Agora falta 1 vizinho.'
          : 'Atualização publicada. Obrigado por contar como está.',
      );
      voltar();
    } catch (e) {
      const err = paraErroServico(e);
      if (err.status === 400 && err.campos?.texto) setErroTexto(err.campos.texto);
      else setErroGeral(err);
      if (err.status === 409) recarregar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <AppBar title="Adicionar atualização" onBack={voltar} backLabel="Voltar à ocorrência" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
        >
          <View
            style={{
              backgroundColor: colors.superficie,
              borderWidth: 1,
              borderColor: colors.linha,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Miniatura o={o} size={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: fonts.negrito, fontSize: 15, color: colors.asfalto }}>
                {o.titulo}
              </Text>
              <StatusChip status={o.status} suffix={`ciclo ${o.numeroCiclo}`} />
            </View>
          </View>

          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: fonts.titulo,
                fontSize: 18,
                color: colors.asfalto,
                marginBottom: 2,
              }}
            >
              O que você viu?
            </Text>
            {TIPOS.map((t) => (
              <OpcaoTipo
                key={t}
                tipo={t}
                selecionado={tipoEfetivo === t}
                desabilitado={bloqueado(t)}
                descricao={textoOpcao(t, o, jaVotei)}
                onPress={() => {
                  setTipo(t);
                  setErroGeral(null);
                }}
              />
            ))}
          </View>

          <FormField
            label="Comentário"
            labelHint={tipoEfetivo === 'COMENTARIO' ? '(ou envie uma foto)' : '(opcional)'}
            rows={3}
            placeholder="Ex.: Passei hoje de manhã e já está tapado."
            value={texto}
            onChangeText={(t) => {
              setTexto(t);
              setErroTexto(undefined);
            }}
            maxLength={1000}
            error={erroTexto}
          />

          {recursos.enviarFotos ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {foto ? (
                <View style={{ width: 72, height: 72 }}>
                  <PhotoBox uri={foto.uri} size={72} radius={14} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remover foto de evidência"
                    onPress={() => setFoto(undefined)}
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: -8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: colors.calcada,
                      backgroundColor: colors.asfalto,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={12} color="#fff" strokeWidth={3} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar foto de evidência"
                  onPress={adicionarFoto}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.concreto,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={24} color={colors.concreto} strokeWidth={1.8} />
                </Pressable>
              )}
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  lineHeight: 19,
                  color: colors.concreto,
                }}
              >
                Foto de evidência (opcional). Uma foto do local ajuda os vizinhos a confiar no voto.
              </Text>
            </View>
          ) : null}

          <Checkbox checked={anonimo} onChange={setAnonimo} label="Publicar anonimamente" />

          {erroGeral ? (
            erroGeral.status === 409 ? (
              <Notice tone="escuro">{MENSAGENS.votoRepetido}</Notice>
            ) : erroGeral.status === 429 ? (
              <Notice tone="alerta">{erroGeral.mensagem}</Notice>
            ) : erroGeral.status === 401 ? (
              <ErrorState
                title="Sua sessão expirou"
                message="Entre de novo para continuar."
                action={{
                  label: 'Entrar de novo',
                  onPress: () =>
                    router.push({
                      pathname: '/login',
                      params: { voltar: `/ocorrencia/${o.id}/atualizar?tipo=${tipoEfetivo}` },
                    }),
                }}
              />
            ) : (
              <ErrorState title="Não conseguimos enviar" message={erroGeral.mensagem} />
            )
          ) : null}

          <Button
            title="Enviar atualização"
            height={56}
            radius={16}
            fontSize={16}
            loading={enviando}
            onPress={enviar}
          />
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              lineHeight: 17,
              color: colors.concreto,
              textAlign: 'center',
            }}
          >
            Cada conta vota uma vez por ciclo. A mesma pessoa nunca fecha ou reabre sozinha.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function Tela() {
  return (
    <Protegida perfil="CIDADAO">
      <Atualizar />
    </Protegida>
  );
}
