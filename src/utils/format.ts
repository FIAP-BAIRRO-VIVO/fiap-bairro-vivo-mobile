import type { Ocorrencia } from '@/models';

const MIN = 60 * 1000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

/** "agora", "há 5 min", "há 3 horas", "ontem", "há 12 dias", "há 2 meses". */
export function tempoRelativo(iso: string, agora = Date.now()): string {
  const diff = Math.max(0, agora - new Date(iso).getTime());
  if (diff < MIN) return 'agora';
  if (diff < HORA) return `há ${Math.floor(diff / MIN)} min`;
  if (diff < DIA) {
    const h = Math.floor(diff / HORA);
    return h === 1 ? 'há 1 hora' : `há ${h} horas`;
  }
  const dias = Math.floor(diff / DIA);
  if (dias === 1) return 'ontem';
  if (dias < 31) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`;
}

/** Bairro tirado do endereço de referência ("Rua Taquari, 520 · Mooca" → "Mooca"). */
export function bairroDe(o: Ocorrencia): string {
  const partes = (o.enderecoReferencia ?? '').split('·').map((p) => p.trim());
  if (partes.length > 1 && partes[partes.length - 1]) return partes[partes.length - 1];
  return o.municipio.nome;
}

/** "Mooca, São Paulo" (ou só o município quando não há bairro). */
export function localDe(o: Ocorrencia): string {
  const bairro = bairroDe(o);
  return bairro === o.municipio.nome
    ? `${o.municipio.nome} · ${o.municipio.uf}`
    : `${bairro}, ${o.municipio.nome}`;
}

/** Texto curto da votação ("1 de 2 para resolver"). */
export function resumoVotos(o: Ocorrencia): string {
  return `${o.totalVotosCiclo} de 2 para ${o.status === 'ABERTA' ? 'resolver' : 'reabrir'}`;
}

/** Linha de apoio dos cartões da lista Explorar. */
export function linhaExplorar(o: Ocorrencia): string {
  const partes: string[] = [];
  if (o.anonimoPublico) partes.push(o.autorExibicao);
  partes.push(bairroDe(o));
  if (o.status === 'RESOLVIDA' && o.totalVotosCiclo === 0) {
    partes.push('confirmada por 2 vizinhos');
  } else {
    partes.push(tempoRelativo(o.dtCriacao));
    if (o.status === 'ABERTA' || o.totalVotosCiclo > 0) partes.push(resumoVotos(o));
  }
  return partes.join(' · ');
}

/** Distância aproximada em metros/quilômetros entre dois pontos. */
export function distancia(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const m = 2 * R * Math.asin(Math.sqrt(a));
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export function dataCurta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
