import { useRouter } from 'expo-router';
import { Info, LocateFixed, Plus, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppBar,
  Button,
  CategoryIcon,
  Checkbox,
  ErrorState,
  FormField,
  MiniMapa,
  Notice,
  PhotoBox,
  SelectField,
  useToast,
} from '@/components';
import { LIMITES, temErros, validarOcorrencia } from '@/domain/ocorrenciaRules';
import { useCatalogo } from '@/hooks/useCatalogo';
import { CENTRO_DEMO, useLocation } from '@/hooks/useLocation';
import type { Categoria, ErroServico, FotoInput, Ocorrencia, OcorrenciaInput } from '@/models';
import { paraErroServico, recursos } from '@/services';
import { colors, fonts } from '@/theme';
import { escolherFoto } from '@/utils/fotos';

export type Erros = Record<string, string | undefined>;

/** Grade de categorias (3 colunas, 76 px). */
function GradeCategorias({
  categorias,
  valor,
  onChange,
}: {
  categorias: Categoria[];
  valor: string;
  onChange: (id: string) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Categoria"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
    >
      {categorias.map((c) => {
        const sel = c.id === valor;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
            accessibilityLabel={c.nome}
            style={{
              flexBasis: '31%',
              flexGrow: 1,
              height: 76,
              borderWidth: sel ? 2 : 1.5,
              borderColor: sel ? colors.verde : colors.linha,
              backgroundColor: sel ? colors.broto : colors.superficie,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CategoryIcon
              icone={c.icone}
              size={22}
              color={sel ? colors.verdeEscuro : colors.asfalto}
              strokeWidth={sel ? 1.9 : 1.8}
            />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: sel ? fonts.negrito : fonts.semi,
                fontSize: 12,
                color: sel ? colors.verdeEscuro : colors.asfalto,
              }}
            >
              {c.nome}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Fotos({
  fotos,
  onChange,
  erro,
}: {
  fotos: FotoInput[];
  onChange: (f: FotoInput[]) => void;
  erro?: string;
}) {
  const toast = useToast();
  const adicionar = async () => {
    try {
      const f = await escolherFoto();
      if (f) onChange([...fotos, f]);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Não foi possível abrir as fotos.', 'aviso');
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>Fotos</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.concreto }}>
          opcional · até {LIMITES.fotosMax}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', paddingTop: 8 }}>
        {fotos.map((f, i) => (
          <View key={f.uri.slice(-40) + i} style={{ width: 84, height: 84 }}>
            <PhotoBox uri={f.uri} size={84} radius={14} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover foto ${i + 1}`}
              onPress={() => onChange(fotos.filter((_, j) => j !== i))}
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
        ))}
        {fotos.length < LIMITES.fotosMax ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto"
            onPress={adicionar}
            style={{
              width: 84,
              height: 84,
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: colors.concreto,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} color={colors.concreto} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      {erro ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}>
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

export interface FormValores {
  idCategoria: string;
  titulo: string;
  descricao: string;
  idMunicipio: string;
  enderecoReferencia: string;
  latitude: number;
  longitude: number;
  localDefinido: boolean;
  fotos: FotoInput[];
  anonimoPublico: boolean;
}

export function valoresIniciais(o?: Ocorrencia): FormValores {
  if (!o) {
    return {
      idCategoria: '',
      titulo: '',
      descricao: '',
      // Vazio: o formulário usa São Paulo (IBGE 3550308) quando a lista carregar.
      idMunicipio: '',
      enderecoReferencia: '',
      latitude: CENTRO_DEMO.latitude,
      longitude: CENTRO_DEMO.longitude,
      localDefinido: false,
      fotos: [],
      anonimoPublico: false,
    };
  }
  return {
    idCategoria: o.categoria.id,
    titulo: o.titulo,
    descricao: o.descricao,
    idMunicipio: o.municipio.id,
    enderecoReferencia: o.enderecoReferencia ?? '',
    latitude: o.latitude,
    longitude: o.longitude,
    localDefinido: true,
    fotos: o.midias.map((m) => ({ uri: m.urlExibicao, mimeType: m.mimeType })),
    anonimoPublico: o.anonimoPublico,
  };
}

export function paraInput(v: FormValores): OcorrenciaInput {
  return {
    titulo: v.titulo,
    descricao: v.descricao,
    idCategoria: v.idCategoria,
    idMunicipio: v.idMunicipio,
    enderecoReferencia: v.enderecoReferencia,
    latitude: v.localDefinido ? v.latitude : null,
    longitude: v.localDefinido ? v.longitude : null,
    anonimoPublico: v.anonimoPublico,
    fotos: v.fotos,
  };
}

interface OcorrenciaFormProps {
  modo: 'nova' | 'editar';
  inicial: FormValores;
  /** Categoria atual na edição (pode estar desativada). */
  categoriaAtual?: Categoria;
  statusAtual?: Ocorrencia['status'];
  onEnviar: (input: OcorrenciaInput) => Promise<void>;
  onFechar: () => void;
  onExcluir?: () => void;
  /** Guarda o rascunho a cada mudança (nova ocorrência). */
  onRascunho?: (v: FormValores) => void;
}

/** Formulário de ocorrência usado em Registrar e Editar. */
export function OcorrenciaForm({
  modo,
  inicial,
  categoriaAtual,
  statusAtual,
  onEnviar,
  onFechar,
  onExcluir,
  onRascunho,
}: OcorrenciaFormProps) {
  const router = useRouter();
  const { categorias: ativas, municipios, carregando } = useCatalogo();
  const local = useLocation();
  const [v, setV] = useState<FormValores>(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<ErroServico | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [trocandoCategoria, setTrocandoCategoria] = useState(modo === 'nova');
  const idMunicipio =
    v.idMunicipio ||
    municipios.find((m) => m.codigoIbge === 3550308)?.id ||
    municipios[0]?.id ||
    '';

  // Na edição, a categoria atual entra na lista mesmo se foi desativada depois.
  const categorias = useMemo(() => {
    if (categoriaAtual && !ativas.some((c) => c.id === categoriaAtual.id))
      return [...ativas, categoriaAtual];
    return ativas;
  }, [ativas, categoriaAtual]);

  const mudar = <K extends keyof FormValores>(k: K, valor: FormValores[K]) => {
    setV((atual) => {
      const novo = { ...atual, [k]: valor };
      onRascunho?.(novo);
      return novo;
    });
    const campo = k === 'latitude' || k === 'longitude' || k === 'localDefinido' ? 'local' : k;
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const usarLocalizacao = async () => {
    const pos = await local.obter();
    if (pos) {
      setV((atual) => {
        const novo = { ...atual, ...pos, localDefinido: true };
        onRascunho?.(novo);
        return novo;
      });
      setErros((e) => ({ ...e, local: undefined }));
    }
  };

  const enviar = async () => {
    setErroGeral(null);
    const input = paraInput({ ...v, idMunicipio });
    const locais = validarOcorrencia(input, categorias, municipios, categoriaAtual?.id);
    if (temErros(locais)) {
      setErros(locais);
      if (locais.idCategoria) setTrocandoCategoria(true);
      return;
    }
    setEnviando(true);
    try {
      await onEnviar(input);
    } catch (e) {
      const erro = paraErroServico(e);
      if (erro.status === 400 && erro.campos) setErros(erro.campos);
      else setErroGeral(erro);
    } finally {
      setEnviando(false);
    }
  };

  const categoriaSel = categorias.find((c) => c.id === v.idCategoria);

  if (!carregando && categorias.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <ErrorState
          title="Nenhuma categoria disponível"
          message="O administrador ainda não liberou categorias para registro."
          action={{ label: 'Voltar', onPress: onFechar, variant: 'outline' }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <AppBar
        kind="close"
        title={modo === 'nova' ? 'Registrar ocorrência' : 'Editar ocorrência'}
        onBack={onFechar}
        backLabel={modo === 'nova' ? 'Fechar' : 'Fechar sem salvar'}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: modo === 'nova' ? 22 : 20, paddingBottom: 40 }}
        >
          {modo === 'editar' && statusAtual ? (
            <Notice icon={<Info size={20} color={colors.asfalto} strokeWidth={2} />}>
              A situação <Text style={{ fontFamily: fonts.negrito }}>{statusAtual}</Text> não pode
              ser editada. Ela só muda quando 2 vizinhos confirmam.
            </Notice>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: fonts.semi,
                fontSize: 13,
                color: colors.asfalto,
                marginBottom: modo === 'nova' ? 2 : 0,
              }}
            >
              Categoria
            </Text>
            {!trocandoCategoria && categoriaSel ? (
              <View
                style={{
                  height: 56,
                  borderWidth: 1.5,
                  borderColor: colors.linha,
                  borderRadius: 14,
                  backgroundColor: colors.superficie,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingLeft: 12,
                  paddingRight: 8,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.broto,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CategoryIcon icone={categoriaSel.icone} size={20} color={colors.verdeEscuro} />
                </View>
                <Text
                  style={{ flex: 1, fontFamily: fonts.semi, fontSize: 15, color: colors.asfalto }}
                >
                  {categoriaSel.nome}
                </Text>
                <Button
                  title="Trocar"
                  variant="ghost"
                  height={40}
                  fontSize={14}
                  onPress={() => setTrocandoCategoria(true)}
                  accessibilityLabel="Trocar categoria"
                />
              </View>
            ) : (
              <GradeCategorias
                categorias={categorias}
                valor={v.idCategoria}
                onChange={(id) => {
                  mudar('idCategoria', id);
                  if (modo === 'editar') setTrocandoCategoria(false);
                }}
              />
            )}
            {erros.idCategoria ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}>
                {erros.idCategoria}
              </Text>
            ) : null}
          </View>

          <FormField
            label="Título"
            labelHint={modo === 'nova' ? '(5 a 150 caracteres)' : undefined}
            placeholder="Ex.: Buraco na Rua Javari"
            value={v.titulo}
            maxLength={LIMITES.tituloMax}
            showCounter={modo === 'editar'}
            onChangeText={(t) => mudar('titulo', t)}
            error={erros.titulo}
          />

          <FormField
            label={modo === 'nova' ? 'O que está acontecendo?' : 'Descrição'}
            placeholder="Conte o que você viu e onde fica exatamente."
            rows={modo === 'nova' ? 3 : 4}
            value={v.descricao}
            onChangeText={(t) => mudar('descricao', t)}
            error={erros.descricao}
          />

          {modo === 'nova' ? (
            <BlocoLocal
              v={v}
              erro={erros.local}
              onMover={(lat, lng) => {
                setV((atual) => {
                  const novo = { ...atual, latitude: lat, longitude: lng, localDefinido: true };
                  onRascunho?.(novo);
                  return novo;
                });
                if (erros.local) setErros((e) => ({ ...e, local: undefined }));
              }}
              onUsarLocalizacao={usarLocalizacao}
              buscando={local.buscando}
              erroGps={local.erro}
            />
          ) : null}

          <SelectField
            label="Município"
            value={idMunicipio}
            onChange={(id) => mudar('idMunicipio', id)}
            error={erros.idMunicipio}
            options={municipios.map((m) => ({ value: m.id, label: `${m.nome} · ${m.uf}` }))}
          />

          <FormField
            label="Endereço de referência"
            labelHint={modo === 'nova' ? '(opcional)' : undefined}
            placeholder="Ex.: Rua Taquari, 520 · Mooca"
            value={v.enderecoReferencia}
            maxLength={LIMITES.enderecoMax}
            onChangeText={(t) => mudar('enderecoReferencia', t)}
            error={erros.enderecoReferencia}
          />

          {modo === 'editar' ? (
            <BlocoLocal
              v={v}
              titulo="Local no mapa"
              altura={120}
              dica="Arraste para ajustar"
              dicaLado="direita"
              erro={erros.local}
              onMover={(lat, lng) =>
                setV((atual) => ({ ...atual, latitude: lat, longitude: lng, localDefinido: true }))
              }
            />
          ) : null}

          {modo === 'nova' ? (
            <>
              {recursos.enviarFotos ? (
                <Fotos fotos={v.fotos} onChange={(f) => mudar('fotos', f)} erro={erros.fotos} />
              ) : (
                <Notice icon={<Info size={18} color={colors.asfalto} strokeWidth={2} />}>
                  Fotos: o envio de imagens aguarda o serviço de armazenamento da API (STANDBY). Por
                  enquanto, publique sem foto.
                </Notice>
              )}
              <Checkbox
                boxed
                checked={v.anonimoPublico}
                onChange={(c) => mudar('anonimoPublico', c)}
                label="Publicar anonimamente"
                description='Os vizinhos verão "Cidadão anônimo". A ocorrência continua em Minhas ocorrências.'
              />
            </>
          ) : null}

          {erroGeral ? (
            <ErroEnvio
              erro={erroGeral}
              modo={modo}
              onLogin={() =>
                router.push({
                  pathname: '/login',
                  params: { voltar: modo === 'nova' ? '/ocorrencia/nova' : undefined },
                })
              }
            />
          ) : null}

          <Button
            title={modo === 'nova' ? 'Publicar ocorrência' : 'Salvar alterações'}
            height={56}
            radius={16}
            fontSize={16}
            loading={enviando}
            onPress={enviar}
          />
          {modo === 'editar' && onExcluir ? (
            <Button
              title="Excluir ocorrência"
              variant="ghost"
              height={48}
              icon={<Trash2 size={18} color={colors.sinalEscuro} strokeWidth={2} />}
              onPress={onExcluir}
              style={{ alignSelf: 'center' }}
              accessibilityHint="Abre a confirmação de exclusão"
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BlocoLocal({
  v,
  erro,
  onMover,
  onUsarLocalizacao,
  buscando,
  erroGps,
  titulo = 'Local',
  altura = 150,
  dica,
  dicaLado,
}: {
  v: FormValores;
  erro?: string;
  onMover: (lat: number, lng: number) => void;
  onUsarLocalizacao?: () => void;
  buscando?: boolean;
  erroGps?: string | null;
  titulo?: string;
  altura?: number;
  dica?: string;
  dicaLado?: 'esquerda' | 'direita';
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>
          {titulo}
        </Text>
        {v.localDefinido ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}>
            {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
          </Text>
        ) : null}
      </View>
      <MiniMapa
        latitude={v.latitude}
        longitude={v.longitude}
        definido={v.localDefinido}
        onChange={onMover}
        height={altura}
        dica={dica}
        dicaLado={dicaLado}
        erro={!!erro}
      />
      {erro ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}>
          {erro}
        </Text>
      ) : null}
      {onUsarLocalizacao ? (
        <Button
          title={buscando ? 'Buscando sua localização…' : 'Usar minha localização'}
          variant="ghost"
          height={44}
          fontSize={14}
          icon={<LocateFixed size={18} color={colors.verde} strokeWidth={2} />}
          onPress={onUsarLocalizacao}
          disabled={buscando}
          style={{ alignSelf: 'flex-start', marginLeft: -8 }}
        />
      ) : null}
      {erroGps ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}>
          {erroGps}
        </Text>
      ) : null}
    </View>
  );
}

function ErroEnvio({
  erro,
  modo,
  onLogin,
}: {
  erro: ErroServico;
  modo: 'nova' | 'editar';
  onLogin: () => void;
}) {
  if (erro.status === 401) {
    return (
      <ErrorState
        title="Sua sessão expirou"
        message="Entre de novo para continuar. O que você estava escrevendo foi guardado."
        action={{ label: 'Entrar de novo', onPress: onLogin }}
      />
    );
  }
  if (erro.status === 403) {
    return (
      <ErrorState
        title="Só quem registrou pode editar"
        message="Você pode contribuir com uma atualização ou foto."
      />
    );
  }
  if (erro.status === 429) return <Notice tone="alerta">{erro.mensagem}</Notice>;
  return (
    <ErrorState
      title="Não conseguimos conectar"
      message={
        modo === 'nova'
          ? `${erro.mensagem} Sua ocorrência ficou salva como rascunho no celular.`
          : erro.mensagem
      }
    />
  );
}
