import { Pencil, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomSheet,
  Button,
  CategoryIcon,
  Checkbox,
  DarkBadge,
  ErrorState,
  FormField,
  ICONES_CATEGORIA,
  Notice,
  SkeletonList,
  TitleHighlight,
  useToast,
  tituloDoErro,
} from '@/components';
import { useCarregar } from '@/hooks/useCarregar';
import type { Categoria, CategoriaInput } from '@/models';
import { categoriaService, paraErroServico, recursos } from '@/services';
import { colors, fonts, type } from '@/theme';

function Interruptor({
  ligado,
  onChange,
  rotulo,
  desabilitado,
}: {
  ligado: boolean;
  onChange: () => void;
  rotulo: string;
  desabilitado?: boolean;
}) {
  return (
    <Pressable
      onPress={onChange}
      disabled={desabilitado}
      accessibilityRole="switch"
      accessibilityState={{ checked: ligado, disabled: desabilitado }}
      accessibilityLabel={rotulo}
      hitSlop={8}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        backgroundColor: ligado ? colors.verde : colors.switchOff,
        padding: 3,
        flexDirection: 'row',
        justifyContent: ligado ? 'flex-end' : 'flex-start',
        opacity: desabilitado ? 0.6 : 1,
      }}
    >
      <View
        style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.superficie }}
      />
    </Pressable>
  );
}

interface FormState {
  id?: string;
  nome: string;
  descricao: string;
  icone: string;
  ativa: boolean;
}

function FormCategoria({
  inicial,
  onFechar,
  onSalvo,
}: {
  inicial: FormState;
  onFechar: () => void;
  onSalvo: (c: Categoria, nova: boolean) => void;
}) {
  const [f, setF] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setErroGeral(null);
    if (f.nome.trim().length < 3) {
      setErros({ nome: 'Use pelo menos 3 caracteres.' });
      return;
    }
    setSalvando(true);
    try {
      const input: CategoriaInput = {
        nome: f.nome,
        descricao: f.descricao,
        icone: f.icone,
        ativa: f.ativa,
      };
      const c = f.id
        ? await categoriaService.editar(f.id, input)
        : await categoriaService.criar(input);
      onSalvo(c, !f.id);
    } catch (e) {
      const err = paraErroServico(e);
      if (err.campos) setErros(err.campos);
      else setErroGeral(err.mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Text style={type.h2}>{f.id ? 'Editar categoria' : 'Nova categoria'}</Text>
      <FormField
        label="Nome"
        value={f.nome}
        maxLength={60}
        placeholder="Ex.: Sinalização"
        onChangeText={(t) => {
          setF({ ...f, nome: t });
          setErros({});
        }}
        error={erros.nome}
      />
      <FormField
        label="Descrição"
        labelHint="(opcional)"
        value={f.descricao}
        maxLength={120}
        placeholder="Ex.: Placas e faixas"
        onChangeText={(t) => setF({ ...f, descricao: t })}
        error={erros.descricao}
      />
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Ícone</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ICONES_CATEGORIA.map((i) => {
            const sel = f.icone === i;
            return (
              <Pressable
                key={i}
                onPress={() => setF({ ...f, icone: i })}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`Ícone ${i}`}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: sel ? 2 : 1.5,
                  borderColor: sel ? colors.verde : colors.linha,
                  backgroundColor: sel ? colors.broto : colors.superficie,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryIcon
                  icone={i}
                  size={22}
                  color={sel ? colors.verdeEscuro : colors.asfalto}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Checkbox
        checked={f.ativa}
        onChange={(v) => setF({ ...f, ativa: v })}
        label="Ativa"
        description="Categorias desativadas somem do cadastro, mas as ocorrências antigas continuam."
      />
      {erroGeral ? <Notice tone="alerta">{erroGeral}</Notice> : null}
      <Button title="Salvar" loading={salvando} onPress={salvar} />
      <Button title="Cancelar" variant="outline" onPress={onFechar} />
    </>
  );
}

/** Categorias (ADMIN): listar, criar, editar, ativar e desativar. */
export default function Categorias() {
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [alternando, setAlternando] = useState<string | null>(null);
  const { dados, erro, carregando, recarregar, setDados } = useCarregar(async () => {
    const [categorias, contagem] = await Promise.all([
      categoriaService.listar(true),
      categoriaService.contarOcorrencias(),
    ]);
    return { categorias, contagem };
  });

  const alternar = async (c: Categoria) => {
    setAlternando(c.id);
    try {
      const editada = await categoriaService.editar(c.id, {
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        ativa: !c.ativa,
      });
      if (dados) {
        setDados({
          ...dados,
          categorias: dados.categorias.map((x) => (x.id === c.id ? editada : x)),
        });
      }
      toast.show(editada.ativa ? `${c.nome} ativada.` : `${c.nome} desativada.`, 'info');
    } catch (e) {
      toast.show(paraErroServico(e).mensagem, 'aviso');
    } finally {
      setAlternando(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <TitleHighlight>Categorias</TitleHighlight>
            <DarkBadge>ADMIN</DarkBadge>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              lineHeight: 21,
              color: colors.concreto,
            }}
          >
            O que o cidadão pode escolher ao registrar. Desativar esconde a categoria do cadastro,
            mas mantém as ocorrências antigas.
          </Text>
        </View>

        <View style={{ paddingTop: 12, paddingHorizontal: 20, gap: 12 }}>
          <Button
            title="Nova categoria"
            icon={<Plus size={18} color="#fff" strokeWidth={2.2} />}
            onPress={() => setForm({ nome: '', descricao: '', icone: 'outro', ativa: true })}
          />

          {carregando ? (
            <SkeletonList count={4} />
          ) : erro || !dados ? (
            <ErrorState
              title={tituloDoErro(erro)}
              message={erro?.mensagem ?? 'Tente de novo.'}
              action={{ label: 'Tentar de novo', onPress: recarregar }}
            />
          ) : (
            <View
              style={{
                backgroundColor: colors.superficie,
                borderWidth: 1,
                borderColor: colors.linha,
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {dados.categorias.map((c, i) => {
                const qtd = dados.contagem[c.id] ?? 0;
                return (
                  <View
                    key={c.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingRight: 12,
                      paddingLeft: 14,
                      borderBottomWidth: i === dados.categorias.length - 1 ? 0 : 1,
                      borderBottomColor: colors.linha,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: colors.calcada,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CategoryIcon
                        icone={c.icone}
                        size={22}
                        color={c.ativa ? colors.asfalto : colors.concreto}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: fonts.negrito,
                          fontSize: 15,
                          color: c.ativa ? colors.asfalto : colors.concreto,
                        }}
                      >
                        {c.nome}
                      </Text>
                      <Text
                        style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.concreto }}
                      >
                        {c.ativa
                          ? (c.descricao ?? 'Sem descrição')
                          : `Desativada · ${qtd} ${qtd === 1 ? 'ocorrência antiga' : 'ocorrências antigas'}`}
                      </Text>
                    </View>
                    <Interruptor
                      ligado={c.ativa}
                      desabilitado={
                        alternando === c.id || (!c.ativa && !recursos.reativarCategoria)
                      }
                      onChange={() => alternar(c)}
                      rotulo={`${c.nome} ativa`}
                    />
                    <Pressable
                      onPress={() =>
                        setForm({
                          id: c.id,
                          nome: c.nome,
                          descricao: c.descricao ?? '',
                          icone: c.icone ?? 'outro',
                          ativa: c.ativa,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${c.nome}`}
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pencil size={18} color={colors.asfalto} strokeWidth={2} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet
        visible={!!form}
        onClose={() => setForm(null)}
        accessibilityLabel={form?.id ? 'Editar categoria' : 'Nova categoria'}
      >
        {form ? (
          <FormCategoria
            key={form.id ?? 'nova'}
            inicial={form}
            onFechar={() => setForm(null)}
            onSalvo={(c, nova) => {
              setForm(null);
              toast.show(nova ? `Categoria ${c.nome} criada.` : 'Categoria atualizada.');
              recarregar();
            }}
          />
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}
