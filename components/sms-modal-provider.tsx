'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Membro } from '@/lib/types';
import { useStore, StoreProvider } from '@/lib/store';
import { aplicarTemplate, contarSms, smsUrl } from '@/lib/sms';
import { Button, SelectNative, Textarea, Label } from '@/components/ui/primitives';
import { toast } from '@/components/ui/toaster';
import { Smartphone, X } from 'lucide-react';

interface SmsTarget { membro: Membro; templateId?: string }

const Ctx = createContext<{ abrir: (t: SmsTarget) => void; abrirLote: (membros: Membro[], templateId?: string) => void }>({ abrir: () => {}, abrirLote: () => {} });
export const useSms = () => useContext(Ctx);

function Inner({ children }: { children: React.ReactNode }) {
  const { membros, templates, config, registarEnvio } = useStore();
  const [target, setTarget] = useState<SmsTarget | null>(null);
  const [lote, setLote] = useState<Membro[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [tplId, setTplId] = useState('');
  const [livre, setLivre] = useState('');
  const [usarLivre, setUsarLivre] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const abrir = useCallback((t: SmsTarget) => {
    setTarget(t);
    setLote(null);
    setTplId(t.templateId ?? '');
    setLivre('');
    setUsarLivre(!t.templateId);
    setConfirmar(false);
  }, []);

  const abrirLote = useCallback((lista: Membro[], templateId?: string) => {
    if (!lista.length) return;
    setLote(lista);
    setIndice(0);
    setTarget({ membro: lista[0], templateId });
    setTplId(templateId ?? '');
    setLivre('');
    setUsarLivre(!templateId);
    setConfirmar(false);
  }, []);

  const membroAtual = target ? (membros.find((m) => m.id === target.membro.id) ?? target.membro) : null;
  const tpl = templates.find((t) => t.id === tplId);

  const final = useMemo(() => {
    if (!membroAtual) return '';
    if (usarLivre) return livre.replaceAll('{Nome}', membroAtual.nome);
    if (!tpl) return '';
    return aplicarTemplate(tpl.conteudo, membroAtual, config);
  }, [usarLivre, livre, tpl, membroAtual, config]);

  const cont = contarSms(final);

  const abrirSms = () => {
    if (!membroAtual || !final.trim()) {
      toast('Escreve ou escolhe uma mensagem primeiro.');
      return;
    }
    window.location.href = smsUrl(membroAtual.telefone, final);
    setConfirmar(true);
  };

  const confirmarEnvio = (sim: boolean) => {
    if (sim && membroAtual) {
      registarEnvio(membroAtual.id, final, usarLivre ? undefined : tpl?.id);
      toast('SMS registado! ✅');
    }
    // Modo lote: avança para o próximo membro
    if (lote) {
      const prox = indice + 1;
      if (prox < lote.length) {
        setIndice(prox);
        setTarget({ membro: lote[prox] });
        setConfirmar(false);
        return;
      }
      toast(`Lote concluído: ${lote.length} membro(s). 🎉`);
      setLote(null);
      setIndice(0);
    }
    setTarget(null);
    setConfirmar(false);
  };

  const saltar = () => {
    if (!lote) return;
    const prox = indice + 1;
    if (prox < lote.length) {
      setIndice(prox);
      setTarget({ membro: lote[prox] });
      setConfirmar(false);
    } else {
      setLote(null);
      setTarget(null);
      setConfirmar(false);
    }
  };

  const fechar = () => {
    setTarget(null);
    setLote(null);
    setIndice(0);
    setConfirmar(false);
  };

  return (
    <Ctx.Provider value={{ abrir, abrirLote }}>
      {children}
      {target && membroAtual && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => !confirmar && fechar()}>
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            {!confirmar ? (
              <>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold">Enviar SMS{lote ? ` (${indice + 1}/${lote.length})` : ''}</h2>
                    <p className="text-sm text-slate-600">{membroAtual.nome} · {membroAtual.telefone}</p>
                    {lote && <p className="mt-1 text-xs font-semibold text-brand-700">Mesma mensagem para {lote.length} membros — personaliza {'{Nome}'} sozinho.</p>}
                  </div>
                  <button onClick={fechar} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X size={18} /></button>
                </div>
                <Label>Modelo de mensagem</Label>
                <SelectNative value={usarLivre ? '__livre__' : tplId} onChange={(e) => {
                  if (e.target.value === '__livre__') setUsarLivre(true);
                  else { setUsarLivre(false); setTplId(e.target.value); }
                }}>
                  <option value="__livre__">✍️ Escrever mensagem livre</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.categoria} — {t.titulo}</option>
                  ))}
                </SelectNative>
                {usarLivre && (
                  <div className="mt-3">
                    <Label>Mensagem (usa {'{Nome}'} se quiseres)</Label>
                    <Textarea rows={4} value={livre} onChange={(e) => setLivre(e.target.value)} placeholder="Olá {Nome}! ..." />
                  </div>
                )}
                <div className="mt-3">
                  <Label>Pré-visualização</Label>
                  <div className="whitespace-pre-wrap rounded-2xl bg-brand-50 p-3.5 text-sm leading-relaxed text-ink">{final || <span className="text-slate-400">Escolhe um modelo para ver a mensagem…</span>}</div>
                  <p className={`mt-1 text-xs ${cont.excede ? 'font-bold text-red-600' : 'text-slate-500'}`}>
                    {cont.chars} caracteres · {cont.segmentos} segmento(s) SMS
                    {cont.excede ? ' ⚠️ excede 1 SMS — poderá ser cobrado como 2' : ''}
                  </p>
                </div>
                <Button onClick={abrirSms} className="mt-4 w-full !py-3.5 text-[15px]">
                  <Smartphone size={18} /> Abrir app de SMS{lote ? ` para ${membroAtual.nome.split(' ')[0]}` : ''}
                </Button>
                {lote && (
                  <Button variant="ghost" onClick={saltar} className="mt-2 w-full">
                    Saltar este membro ⏭️
                  </Button>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">Enviaste a mensagem{lote ? ` (${indice + 1}/${lote.length})` : ''}?</h2>
                <p className="mt-1 text-sm text-slate-600">Se tocares em «Sim», registamos no histórico e marcamos o membro como «Contatado»{lote && indice + 1 < lote.length ? ' e passamos ao próximo.' : '.'}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => confirmarEnvio(false)}>{lote ? 'Saltar' : 'Não'}</Button>
                  <Button onClick={() => confirmarEnvio(true)}>Sim, enviei ✅</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function SmsModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Inner>{children}</Inner>
    </StoreProvider>
  );
}
