import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

/** Centro de demonstração (Mooca, São Paulo) quando não há GPS. */
export const CENTRO_DEMO = { latitude: -23.5489, longitude: -46.5964 };

/**
 * "Usar minha localização": pede permissão só quando a pessoa toca no botão.
 * Funciona no web (navigator.geolocation) e no celular.
 */
export function useLocation() {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const obter = useCallback(async () => {
    setBuscando(true);
    setErro(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setErro('Sem permissão de localização. Ajuste o pino arrastando o mapa.');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      setErro('Não conseguimos achar sua localização. Ajuste o pino arrastando o mapa.');
      return null;
    } finally {
      setBuscando(false);
    }
  }, []);

  return { obter, buscando, erro };
}
