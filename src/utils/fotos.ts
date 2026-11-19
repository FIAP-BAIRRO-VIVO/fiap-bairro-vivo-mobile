import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { FotoInput } from '@/models';

const LADO_MAX = 1024;

/** No web, reduz a imagem e converte para data URL (sobrevive ao recarregar a página). */
async function reduzirNoWeb(uri: string): Promise<string> {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    img.src = uri;
  });
  const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) return uri;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Abre a galeria e devolve a foto pronta para guardar, ou null se a pessoa cancelar.
 * STANDBY: com a API .NET, a foto vai pelo endpoint de mídias (upload no backend).
 */
export async function escolherFoto(): Promise<FotoInput | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Permita o acesso às fotos para anexar uma imagem.');
  }
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.6,
    allowsEditing: false,
  });
  if (r.canceled || !r.assets?.length) return null;
  const asset = r.assets[0];
  if (Platform.OS === 'web') {
    return { uri: await reduzirNoWeb(asset.uri), mimeType: 'image/jpeg' };
  }
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}
