'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button, Card, Input, Badge, Label, Textarea, SelectNative, EmptyState, Fab } from '@/components/ui/primitives';
import { CATEGORIAS } from '@/lib/types';
import { toast } from '@/components/ui/toaster';
import { Plus, Pencil, Trash2, Copy, X } from 'lucide-react';
import { uid } from '@/lib/utils';

export default function Mensagens() {
  const { templates, setTemplates, loaded } = useStore();
  const [cat, setCat] = useState<string>('todas');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<null | { editId?: string }>(null);
  const [form, setForm] = useState({ titulo: '', categoria: CATEGORIAS[0] as string, conteudo: '', versiculo_ref: '' });

  const lista = useMemo(() => {
    return templates.filter((t) => {
      if (cat !== 'todas' && t.categoria !== cat) return false;
      if (q && !(t.titulo.toLowerCase().includes(q.toLowerCase()) || t.conteudo.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [templates, cat, q]);

  const guardar = () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) { toast('Preenche o título e o conteúdo. ⚠️'); return; }
    if (modal?.editId) {
      setTemplates((p) => p.map((t) => (t.id === modal.editId ? { ...t, ...form } : t)));
      toast('Template atualizado! ✅');
    } else {
      setTemplates((p) => [{ ...form, id: uid('tpl') }, ...p]);
      toast('Template criado! 🎉');
    }
    setModal(null);
  };

  if (!loaded) return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />)}
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Modelos SMS</h1>
        <p className="text-[13px] text-slate-500">{templates.length} modelos · {'{Nome}'}, {'{Nome_Igreja}'}, {'{Lider}'}</p>
      </div>

      <Input placeholder="Pesquisar modelos…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full !pl-4 shadow-card" />
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {['todas', ...CATEGORIAS].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`touch-manip shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold transition active:scale-95 ${cat === c ? 'bg-ink text-white shadow-card' : 'bg-white text-slate-600 shadow-card'}`}>
            {c === 'todas' ? 'Todos' : c}
          </button>
        ))}
      </div>

      {lista.length === 0 ? <EmptyState emoji="💬" title="Sem modelos aqui" hint="Cria o teu primeiro modelo com o botão +." /> :
        <ul className="space-y-2">
          {lista.map((t) => (
            <li key={t.id}>
              <Card className="!p-3.5">
                <div className="flex flex-wrap items-center gap-1.5"><Badge tone="amber">{t.categoria}</Badge>{t.versiculo_ref && <span className="text-xs italic text-slate-500">{t.versiculo_ref}</span>}</div>
                <p className="mt-1.5 text-[15px] font-bold">{t.titulo}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{t.conteudo}</p>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  <button onClick={() => { setForm({ titulo: t.titulo, categoria: t.categoria, conteudo: t.conteudo, versiculo_ref: t.versiculo_ref ?? '' }); setModal({ editId: t.id }); }} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:scale-[.98]"><Pencil size={13} /> Editar</button>
                  <button onClick={() => { setTemplates((p) => [{ ...t, id: uid('tpl'), titulo: t.titulo + ' (cópia)', isPadrao: false }, ...p]); toast('Template duplicado! 📋'); }} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:scale-[.98]"><Copy size={13} /> Duplicar</button>
                  <button onClick={() => { if (confirm(`Apagar «${t.titulo}»?`)) { setTemplates((p) => p.filter((x) => x.id !== t.id)); toast('Template apagado. 🗑️'); } }} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 active:scale-[.98]"><Trash2 size={13} /> Apagar</button>
                </div>
              </Card>
            </li>
          ))}
        </ul>}

      <Fab onClick={() => { setForm({ titulo: '', categoria: CATEGORIAS[0], conteudo: '', versiculo_ref: '' }); setModal({}); }} aria-label="Novo modelo"><Plus size={24} /></Fab>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onClick={() => setModal(null)}>
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal.editId ? 'Editar modelo' : 'Novo modelo'}</h2>
              <button onClick={() => setModal(null)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Lembrete de culto" /></div>
              <div><Label>Categoria</Label><SelectNative value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</SelectNative></div>
              <div><Label>Conteúdo (usa {'{Nome}'}, {'{Nome_Igreja}'}, {'{Lider}'})</Label><Textarea rows={5} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} placeholder="Olá {Nome}! ..." /></div>
              <div><Label>Referência bíblica (opcional)</Label><Input value={form.versiculo_ref} onChange={(e) => setForm({ ...form, versiculo_ref: e.target.value })} placeholder="Ex.: Filipenses 4:13" /></div>
              <Button onClick={guardar} className="w-full !py-3.5 text-[15px]">Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
