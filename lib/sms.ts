import type { Config, Membro, Template } from './types';
import { primeiroNome } from './utils';

/** Substitui {Nome}, {Primeiro_Nome}, {Nome_Igreja}, {Lider}, etc. */
export function aplicarTemplate(
  conteudo: string,
  membro: Pick<Membro, 'nome' | 'responsavel'>,
  config: Config
): string {
  const nomeCompleto = membro.nome || '';
  const mapa: Record<string, string> = {
    Nome: nomeCompleto,
    Nome_completo: nomeCompleto,
    Primeiro_Nome: primeiroNome(nomeCompleto),
    PrimeiroNome: primeiroNome(nomeCompleto),
    Nome_Igreja: config.nome_igreja || '',
    Igreja: config.nome_igreja || '',
    Lider: membro.responsavel || config.lider_principal || '',
    Líder: membro.responsavel || config.lider_principal || '',
    Responsavel: membro.responsavel || config.lider_principal || '',
  };
  let out = conteudo;
  for (const [k, v] of Object.entries(mapa)) {
    out = out.split(`{${k}}`).join(v);
    out = out.split(`{${k.toLowerCase()}}`).join(v);
  }
  return out;
}

/** Conta segmentos SMS (GSM 160 / unicode 70 simplificado) */
export function contarSms(texto: string): { chars: number; segmentos: number; excede: boolean } {
  const chars = [...texto].length;
  const temUnicode = /[^\x00-\x7F]/.test(texto);
  const porSegmento = temUnicode ? 70 : 160;
  const segmentos = chars === 0 ? 0 : Math.ceil(chars / porSegmento);
  return { chars, segmentos, excede: chars > porSegmento };
}

export function smsUrl(telefone: string, corpo: string): string {
  const tel = (telefone || '').replace(/[\s-]/g, '');
  return `sms:${tel}?body=${encodeURIComponent(corpo)}`;
}
