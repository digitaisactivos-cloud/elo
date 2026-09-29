'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, Badge, Button, Card, EmptyState, Fab, Input, Label, Textarea, SelectNative } from '@/components/ui/primitives';
import { STATUS_LABEL, TAGS, type Membro, type StatusMembro } from '@/lib/types';
import { useSms } from '@/components/sms-modal-provider';
import { toast } from '@/components/ui/toaster';
import { Plus, Pencil, Trash2, Smartphone, History, X, Search, Phone } from 'lucide-react';
import { uid, isoParaData } from '@/lib/utils';

const EMPTY: Omit<Membro, 'id' | 'criado_em'> = {
  nome: '', telefone: '', aniversario: '', tags: [], status: 'nao_contatado', responsavel: '', notas: '', proximo_contato: '',
};

export default function Membros() {
  const { membros, envios, adicionarMembro, atualizarMembro, removerMembro, loaded } = useStore();
  const { abrir, abrirLote } = useSms();
  const [pesquisa, setPesquisa] = useState('');
  const [fTag, setFTag] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [modal, setModal] = useState<null | { editId?: string }>(null);
  const [form, setForm] = useState(EMPTY);
  const [histId, setHistId] = useState<string | null>(null);
  const [aSelecionar, setASelecionar] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const filtrados = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return membros.filter((m) => {
      if (q && !(m.nome.toLowerCase().includes(q) || m.telefone.includes(q))) return false;
      if (fTag && !m.tags.includes(fTag)) return false;
      if (fStatus && m.status !== fStatus) return false;
      return true;
    });
  }, [membros, pesquisa, fTag, fStatus]);

  const abrirNovo = () => { setForm(EMPTY); setModal({}); };
  const abrirEditar = (m: Membro) => {
    setForm({ nome: m.nome, telefone: m.telefone, aniversario: m.aniversario ?? '', tags: m.tags, status: m.status, responsavel: m.responsavel ?? '', notas: m.notas ?? '', proximo_contato: m.proximo_contato ?? '' });
    setModal({ editId: m.id });
  };

  const guardar = () => {
    if (!form.nome.trim() || !form.telefone.trim()) { toast('Preenche o nome e o telefone. ⚠️'); return; }
    if (modal?.editId) { atualizarMembro(modal.editId, form); toast('Membro atualizado! ✅'); }
    else { adicionarMembro(form); toast('Membro adicionado! 🎉'); }
    setModal(null);
  };

  const toggleTag = (t: string) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }));

  const toggleSelecao = (id: string) =>
    setSelecionados((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const iniciarLote = () => {
    const lista = membros.filter((m) => selecionados.has(m.id));
    if (!lista.length) { toast('Seleciona pelo menos 1 membro. ⚠️'); return; }
    abrirLote(lista);
  };

  if (!loaded) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-3xl bg-white p-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-slate-100" /><div className="h-3 w-1/3 rounded bg-slate-100" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Membros</h1>
          <p className="text-[13px] text-slate-500">{filtrados.length} de {membros.length} · toca num membro para agir</p>
        </div>
        <button
          onClick={() => { setASelecionar(!aSelecionar); setSelecionados(new Set()); }}
          className={`touch-manip shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition active:scale-95 ${aSelecionar ? 'bg-ink text-white' : 'bg-white text-brand-700 shadow-card'}`}
        >
          {aSelecionar ? 'Cancelar' : '☑️ Selecionar'}
        </button>
      </div>

      <div className="sticky top-[calc(.25rem+env(safe-area-inset-top,0px))] z-20 -mx-4 bg-mist/90 px-4 py-2 backdrop-blur-xl md:static md:bg-transparent md:p-0">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="rounded-full !pl-11 shadow-card" placeholder="Pesquisar nome ou telefone…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          <select value={fTag} onChange={(e) => setFTag(e.target.value)} className="h-10 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600 outline-none">
            <option value="">Todas as tags</option>{TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-10 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600 outline-none">
            <option value="">Todos os status</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(fTag || fStatus || pesquisa) && (
            <button onClick={() => { setFTag(''); setFStatus(''); setPesquisa(''); }} className="h-10 shrink-0 rounded-full bg-ink px-4 text-[13px] font-semibold text-white">Limpar</button>
          )}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState emoji="👥" title="Sem membros aqui" hint="Toca no + para adicionar ou importa via Excel nas Ajustes." />
      ) : (
        <ul className="space-y-2">
          {filtrados.map((m) => (
            <li key={m.id}>
              <Card className={`!p-3 ${selecionados.has(m.id) ? '!border-brand-500 !ring-4 !ring-brand-100' : ''}`}>
                <div className="flex items-center gap-3">
                  {aSelecionar && (
                    <button
                      onClick={() => toggleSelecao(m.id)}
                      aria-label="Selecionar"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${selecionados.has(m.id) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}
                    >
                      ✓
                    </button>
                  )}
                  <Avatar nome={m.nome} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{m.nome}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><Phone size={11} /> {m.telefone}{m.aniversario ? ` · 🎂 ${isoParaData(m.aniversario)}` : ''}</p>
                  </div>
                  <button onClick={() => abrir({ membro: m })} aria-label="Enviar SMS" className="touch-manip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-fab transition active:scale-95">
                    <Smartphone size={18} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{STATUS_LABEL[m.status]}</Badge>
                  {m.tags.slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}
                  {m.tags.length > 3 && <Badge>+{m.tags.length - 3}</Badge>}
                  {m.proximo_contato && <Badge tone="amber">📅 {isoParaData(m.proximo_contato)}</Badge>}
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  <button onClick={() => abrirEditar(m)} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:scale-[.98]"><Pencil size={13} /> Editar</button>
                  <button onClick={() => setHistId(m.id)} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:scale-[.98]"><History size={13} /> Hist.</button>
                  <button onClick={() => { if (confirm(`Apagar ${m.nome}?`)) { removerMembro(m.id); toast('Membro apagado. 🗑️'); } }} className="touch-manip flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 active:scale-[.98]"><Trash2 size={13} /> Apagar</button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={abrirNovo} aria-label="Novo membro"><Plus size={24} /></Fab>

      {aSelecionar && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-4 md:bottom-6">
          <div className="flex items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/95 p-2 shadow-card backdrop-blur-xl">
            <button
              onClick={() => setSelecionados(new Set(filtrados.map((m) => m.id)))}
              className="touch-manip rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700"
            >
              Todos ({filtrados.length})
            </button>
            <Button onClick={iniciarLote} disabled={selecionados.size === 0} className="flex-1 !py-3 text-sm">
              <Smartphone size={16} /> Enviar para {selecionados.size} 📤
            </Button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => setModal(null)}>
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal.editId ? 'Editar membro' : 'Novo membro'}</h2>
              <button onClick={() => setModal(null)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><Label>Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Maria Nhaca" /></div>
              <div><Label>Telefone * (formato +258…)</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="+258841234567" inputMode="tel" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nascimento</Label><Input type="date" value={form.aniversario} onChange={(e) => setForm({ ...form, aniversario: e.target.value })} /></div>
                <div><Label>Próximo contato</Label><Input type="date" value={form.proximo_contato} onChange={(e) => setForm({ ...form, proximo_contato: e.target.value })} /></div>
              </div>
              <div><Label>Tags</Label><div className="flex flex-wrap gap-1.5">{TAGS.map((t) => (
                <button key={t} onClick={() => toggleTag(t)} className={`touch-manip rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${form.tags.includes(t) ? 'bg-brand-600 text-white shadow-fab' : 'bg-slate-100 text-slate-700'}`}>{t}</button>))}</div></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Status</Label><SelectNative value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusMembro })}>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectNative></div>
                <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do líder" /></div>
              </div>
              <div><Label>Notas</Label><Textarea rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Notas livres…" /></div>
              <Button onClick={guardar} className="w-full !py-3.5 text-[15px]">Guardar</Button>
            </div>
          </div>
        </div>
      )}

      {histId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onClick={() => setHistId(null)}>
          <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-white p-5 sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Histórico</h2>
              <button onClick={() => setHistId(null)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X size={18} /></button>
            </div>
            {(() => {
              const m = membros.find((x) => x.id === histId);
              const lista = envios.filter((e) => e.membro_id === histId);
              return (
                <>
                  <p className="mb-2 text-sm text-slate-600">{m?.nome} · {lista.length} envio(s)</p>
                  {lista.length === 0 ? <EmptyState emoji="💬" title="Ainda sem envios" /> :
                    <ul className="space-y-2">{lista.map((e) => (
                      <li key={e.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                        <p className="whitespace-pre-wrap">{e.conteudo_final}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(e.enviado_em).toLocaleString('pt-MZ')}</p>
                      </li>))}</ul>}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
void uid;
