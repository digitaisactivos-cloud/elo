'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button, Card, Input, Label } from '@/components/ui/primitives';
import { Database, RefreshCw, PlugZap, Trash2 } from 'lucide-react';
import { getSupabaseConfig, guardarSupabaseLocal, limparSupabaseLocal } from '@/lib/supabase';
import { toast } from '@/components/ui/toaster';

/** Bloqueia a app até o Supabase estar configurado — tudo vive na nuvem. */
export function SupabaseGate({ children }: { children: React.ReactNode }) {
  const { supabaseAtivo, loaded, erroSync } = useStore();
  const [url, setUrl] = useState('');
  const [chave, setChave] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  if (!loaded || supabaseAtivo) return <>{children}</>;

  const cfg = getSupabaseConfig();

  const ligar = async () => {
    const u = url.trim();
    const k = chave.trim();
    if (!u.startsWith('https://') || !u.includes('.supabase.co')) {
      toast('URL inválido. Usa https://xyz.supabase.co ⚠️');
      return;
    }
    if (k.length < 20) {
      toast('Anon key inválida. Cola a anon key completa. ⚠️');
      return;
    }
    setAGuardar(true);
    try {
      guardarSupabaseLocal(u, k);
      toast('Ligado! A carregar dados… ✅');
      // o store recarrega sozinho via evento; fallback recarrega a página
      setTimeout(() => { if (!isAtivo()) location.reload(); }, 1500);
    } finally {
      setAGuardar(false);
    }
  };

  const isAtivo = () => getSupabaseConfig().fonte !== 'none';

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-2 py-10">
      <Card className="w-full !p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-100 text-brand-700">
          <Database size={26} />
        </span>
        <h1 className="mt-3 text-xl font-bold tracking-tight">Ligar ao Supabase</h1>
        <p className="mt-1 text-sm text-slate-500">
          A app guarda tudo na nuvem. Falta configurar a ligação neste dispositivo.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Diagnóstico: build sem vars ({cfg.fonte === 'none' ? 'nenhuma detetada' : cfg.fonte}){erroSync ? ` · último erro: ${erroSync}` : ''}.
          No PC usa <code className="rounded bg-slate-200 px-1">.env.local</code>; no telemóvel/Vercel cola abaixo.
        </p>

        <div className="mt-4 space-y-2 text-left">
          <div><Label>Project URL</Label><Input placeholder="https://xyz.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" /></div>
          <div><Label>Anon key</Label><Input placeholder="eyJhbGciOi…" value={chave} onChange={(e) => setChave(e.target.value)} type="password" /></div>
          <Button onClick={ligar} disabled={aGuardar} className="w-full">
            <PlugZap size={16} /> {aGuardar ? 'A ligar…' : 'Guardar e ligar'}
          </Button>
          <Button variant="outline" onClick={() => { limparSupabaseLocal(); setUrl(''); setChave(''); toast('Ligação local apagada. 🗑️'); }} className="w-full">
            <Trash2 size={16} /> Apagar ligação deste dispositivo
          </Button>
        </div>

        <ol className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-[13px] text-slate-600">
          <li><b>1.</b> Cria o projeto em <b>supabase.com</b> (grátis).</li>
          <li><b>2.</b> Em <b>SQL Editor → New query</b>, cola o ficheiro <code className="rounded bg-slate-200 px-1">supabase-schema.sql</code> e corre (Run).</li>
          <li><b>3.</b> Em <b>Project Settings → API</b>, copia o <b>Project URL</b> e a <b>anon key</b>.</li>
          <li><b>4.</b> No PC: cria <code className="rounded bg-slate-200 px-1">.env.local</code> na raiz e reinicia com <code className="rounded bg-slate-200 px-1">npm run dev</code>. Na Vercel: Settings → Environment Variables → Redeploy.</li>
        </ol>
        <Button variant="ghost" onClick={() => location.reload()} className="mt-2 w-full">
          <RefreshCw size={16} /> Já configurei — recarregar
        </Button>
      </Card>
    </div>
  );
}
