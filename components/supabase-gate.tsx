'use client';
import { useStore } from '@/lib/store';
import { Button, Card } from '@/components/ui/primitives';
import { Database, RefreshCw } from 'lucide-react';

/** Bloqueia a app até o Supabase estar configurado — tudo vive na nuvem. */
export function SupabaseGate({ children }: { children: React.ReactNode }) {
  const { supabaseAtivo, loaded } = useStore();
  if (!loaded || supabaseAtivo) return <>{children}</>;

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
        <ol className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-[13px] text-slate-600">
          <li><b>1.</b> Cria o projeto em <b>supabase.com</b> (grátis).</li>
          <li><b>2.</b> Em <b>SQL Editor → New query</b>, cola o ficheiro <code className="rounded bg-slate-200 px-1">supabase-schema.sql</code> e corre (Run).</li>
          <li><b>3.</b> Em <b>Project Settings → API</b>, copia o <b>Project URL</b> e a <b>anon key</b>.</li>
          <li><b>4.</b> Cria o ficheiro <code className="rounded bg-slate-200 px-1">.env.local</code> na raiz:
            <pre className="mt-1 overflow-x-auto rounded-xl bg-ink p-2 text-left text-[11px] text-white">{`NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}</pre>
          </li>
          <li><b>5.</b> Reinicia com <code className="rounded bg-slate-200 px-1">npm run dev</code>. Na Vercel, adiciona as 2 vars em Settings → Environment Variables.</li>
        </ol>
        <Button onClick={() => location.reload()} className="mt-4 w-full">
          <RefreshCw size={16} /> Já configurei — recarregar
        </Button>
      </Card>
    </div>
  );
}
