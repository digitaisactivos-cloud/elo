'use client';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, Badge, Card, EmptyState } from '@/components/ui/primitives';
import { useSms } from '@/components/sms-modal-provider';
import { toast } from '@/components/ui/toaster';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { isoParaData } from '@/lib/utils';

export default function Agenda() {
  const { membros, atualizarMembro, registarEnvio, loaded } = useStore();
  const { abrir } = useSms();

  const agendados = useMemo(
    () => membros.filter((m) => m.proximo_contato).sort((a, b) => (a.proximo_contato! > b.proximo_contato! ? 1 : -1)),
    [membros]
  );

  if (!loaded) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div><h1 className="text-[22px] font-bold tracking-tight">Agenda</h1><p className="text-[13px] text-slate-500">{agendados.length} follow-up(s) agendados</p></div>
      {agendados.length === 0 ? (
        <EmptyState emoji="📅" title="Sem follow-ups agendados" hint="Define o próximo contato no perfil do membro." />
      ) : (
        <ul className="space-y-2">
          {agendados.map((m) => {
            const atrasado = new Date(m.proximo_contato!) < new Date(new Date().toDateString());
            const hoje = new Date(m.proximo_contato!).toDateString() === new Date().toDateString();
            return (
              <li key={m.id}>
                <Card className="!p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar nome={m.nome} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{m.nome}</p>
                      <p className="truncate text-xs text-slate-500">{m.telefone}{m.responsavel ? ` · ${m.responsavel}` : ''}</p>
                    </div>
                    {hoje ? <Badge tone="amber">Hoje</Badge> : atrasado ? <Badge tone="red">Em atraso</Badge> : <Badge tone="brand">📅 {isoParaData(m.proximo_contato)}</Badge>}
                  </div>
                  {!hoje && !atrasado && <p className="mt-1.5 text-xs text-slate-500">Agendado para {isoParaData(m.proximo_contato)}</p>}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <button onClick={() => abrir({ membro: m })} className="touch-manip flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-brand-600 text-xs font-bold text-white shadow-fab active:scale-[.98]"><Smartphone size={15} /> Enviar SMS</button>
                    <button
                      onClick={() => {
                        atualizarMembro(m.id, { proximo_contato: undefined, ultima_interacao: new Date().toISOString(), status: 'concluido' });
                        registarEnvio(m.id, `[Follow-up concluído em ${new Date().toLocaleDateString('pt-MZ')}]`);
                        toast('Marcado como feito! ✅');
                      }}
                      className="touch-manip flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 text-xs font-bold text-white active:scale-[.98]"
                    >
                      <CheckCircle2 size={15} /> Concluir
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
