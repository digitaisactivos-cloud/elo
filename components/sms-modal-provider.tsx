'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Membro } from '@/lib/types';
import { useStore, StoreProvider } from '@/lib/store';
import { aplicarTemplate, contarSms, smsUrl } from '@/lib/sms';
import { Button, SelectNative, Textarea, Label } from '@/components/ui/primitives';
import { toast } from '@/components/ui/toaster';
import { Smartphone, X } from 'lucide-react';

interface SmsTarget { membro: Membro; templateId?: string }

const Ctx = createContext<{ abrir: (t: SmsTarget) => void }>({ abrir: () => {} });
export const useSms = () => useContext(Ctx);

function Inner({ children }: { children: React.ReactNode }) {
  const { membros, templates, config, registarEnvio } = useStore();
  const [target, setTarget] = useState<SmsTarget | null>(null);
  const [tplId, setTplId] = useState('');
  const [livre, setLivre] = useState('');
  const [usarLivre, setUsarLivre] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const abrir = useCallback((t: SmsTarget) => {
    setTarget(t);
    setTplId(t.templateId ?? '');
    setLivre('');
    setUsarLivre(!t.templateId);
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
    setTarget(null);
    setConfirmar(false);
  };

  return (
    <Ctx.Provider value={{ abrir }}>
      {children}
      {target && membroAtual && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => !confirmar && setTarget(null)}>
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            {!confirmar ? (
              <>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold">Enviar SMS</h2>
                    <p className="text-sm text-slate-600">{membroAtual.nome} · {membroAtual.telefone}</p>
                  </div>
                  <button onClick={() => setTarget(null)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X size={18} /></button>
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
                  <Smartphone size={18} /> Abrir app de SMS
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">Enviaste a mensagem?</h2>
                <p className="mt-1 text-sm text-slate-600">Se tocares em «Sim», registamos no histórico e marcamos o membro como «Contatado».</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => confirmarEnvio(false)}>Não</Button>
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
