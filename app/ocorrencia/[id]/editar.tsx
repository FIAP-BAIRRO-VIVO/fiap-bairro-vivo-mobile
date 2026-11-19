import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ErrorState,
  ExcluirSheet,
  Protegida,
  SkeletonList,
  useToast,
  tituloDoErro,
} from '@/components';
import { OcorrenciaForm, valoresIniciais } from '@/features/OcorrenciaForm';
import { useCarregar } from '@/hooks/useCarregar';
import { useSession } from '@/hooks/useSession';
import { ocorrenciaService, paraErroServico } from '@/services';
import { colors } from '@/theme';

function EditarOcorrencia() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { sessao } = useSession();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const {
    dados: o,
    erro,
    carregando,
    recarregar,
  } = useCarregar(() => ocorrenciaService.obter(id), [id]);

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/minhas'));

  if (carregando) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.calcada, padding: 20 }}>
        <SkeletonList count={3} />
      </SafeAreaView>
    );
  }

  if (erro || !o) {
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

  // 403: só quem registrou edita (a camada de serviço também bloqueia).
  if (o.idAutor !== sessao?.idUsuario) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <ErrorState
          icon={<Lock size={20} color={colors.asfalto} strokeWidth={2} />}
          title="Só quem registrou pode editar"
          message="Você pode contribuir com uma atualização ou foto."
          action={{
            label: 'Adicionar atualização',
            variant: 'outline',
            onPress: () => router.replace(`/ocorrencia/${o.id}/atualizar?tipo=COMENTARIO`),
          }}
        />
      </SafeAreaView>
    );
  }

  const excluir = async () => {
    setExcluindo(true);
    try {
      await ocorrenciaService.excluir(o.id);
      setConfirmando(false);
      toast.show('Ocorrência excluída. O histórico fica guardado.');
      router.dismissTo('/minhas');
    } catch (e) {
      toast.show(paraErroServico(e).mensagem, 'aviso');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <OcorrenciaForm
        modo="editar"
        inicial={valoresIniciais(o)}
        categoriaAtual={o.categoria}
        statusAtual={o.status}
        onFechar={fechar}
        onExcluir={() => setConfirmando(true)}
        onEnviar={async (input) => {
          await ocorrenciaService.editar(o.id, input);
          toast.show('Alterações salvas.');
          fechar();
        }}
      />
      <ExcluirSheet
        visible={confirmando}
        titulo={o.titulo}
        excluindo={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setConfirmando(false)}
      />
    </View>
  );
}

export default function Tela() {
  return (
    <Protegida perfil="CIDADAO">
      <EditarOcorrencia />
    </Protegida>
  );
}
