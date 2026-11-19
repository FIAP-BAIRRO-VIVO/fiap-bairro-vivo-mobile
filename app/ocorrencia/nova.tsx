import { useRouter } from 'expo-router';

import { Protegida, useToast } from '@/components';
import { OcorrenciaForm, valoresIniciais } from '@/features/OcorrenciaForm';
import { lerRascunho, limparRascunho, salvarRascunho } from '@/features/rascunho';
import { ocorrenciaService } from '@/services';

function NovaOcorrencia() {
  const router = useRouter();
  const toast = useToast();

  return (
    <OcorrenciaForm
      modo="nova"
      inicial={lerRascunho() ?? valoresIniciais()}
      onRascunho={salvarRascunho}
      onFechar={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onEnviar={async (input) => {
        const nova = await ocorrenciaService.criar(input);
        limparRascunho();
        toast.show('Ocorrência publicada. Os vizinhos já podem ver no mapa.');
        router.replace(`/ocorrencia/${nova.id}`);
      }}
    />
  );
}

export default function Tela() {
  return (
    <Protegida perfil="CIDADAO">
      <NovaOcorrencia />
    </Protegida>
  );
}
