'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Config, Envio, Membro, Template } from '@/lib/types';
import { SEED_TEMPLATES, TEMPLATE_MIGRATIONS, HORARIO_CULTOS_PADRAO, HORARIO_CULTOS_ANTIGO } from '@/lib/seed-templates';
import { uid } from '@/lib/utils';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/components/ui/toaster';

interface Store {
  membros: Membro[];
  templates: Template[];
  envios: Envio[];
  config: Config;
  loaded: boolean;
  supabaseAtivo: boolean;
  aSincronizar: boolean;
  erroSync: string | null;
  setMembros: (fn: (p: Membro[]) => Membro[]) => void;
  setTemplates: (fn: (p: Template[]) => Template[]) => void;
  setEnvios: (fn: (p: Envio[]) => Envio[]) => void;
  setConfig: (c: Config) => void;
  adicionarMembro: (m: Omit<Membro, 'id' | 'criado_em'>) => Membro;
  atualizarMembro: (id: string, patch: Partial<Membro>) => void;
  removerMembro: (id: string) => void;
  registarEnvio: (membroId: string, conteudo: string, templateId?: string) => void;
}

const Ctx = createContext<Store | null>(null);

const DEFAULT_CONFIG: Config = {
  nome_igreja: 'Igreja Evangélica',
  lider_principal: '',
  horario_cultos: HORARIO_CULTOS_PADRAO,
  endereco: '',
};

const paraSBTemplate = (t: Template) => ({
  id: t.id, titulo: t.titulo, categoria: t.categoria, conteudo: t.conteudo,
  versiculo_ref: t.versiculo_ref ?? null, is_padrao: t.isPadrao ?? false,
});
const deSBTemplate = (r: Record<string, unknown>): Template => ({
  id: String(r.id), titulo: String(r.titulo ?? ''), categoria: String(r.categoria ?? ''),
  conteudo: String(r.conteudo ?? ''),
  versiculo_ref: (r.versiculo_ref as string) ?? undefined,
  isPadrao: Boolean(r.is_padrao),
});

/** Sincroniza só o que mudou (upsert) + o que foi removido (delete) */
async function syncTabela<T extends { id: string }>(
  sb: SupabaseClient,
  tabela: string,
  antes: T[],
  depois: T[],
  mapear: (x: T) => unknown = (x) => x
) {
  const snap = new Map(antes.map((x) => [x.id, JSON.stringify(x)]));
  const mudados = depois.filter((x) => snap.get(x.id) !== JSON.stringify(x));
  for (let i = 0; i < mudados.length; i += 200) {
    const { error } = await sb.from(tabela).upsert(mudados.slice(i, i + 200).map(mapear) as never[], { onConflict: 'id' });
    if (error) throw error;
  }
  const idsDepois = new Set(depois.map((x) => x.id));
  for (const r of antes.filter((x) => !idsDepois.has(x.id))) {
    const { error } = await sb.from(tabela).delete().eq('id', r.id);
    if (error) throw error;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [membros, setMembrosState] = useState<Membro[]>([]);
  const [templates, setTemplatesState] = useState<Template[]>([]);
  const [envios, setEnviosState] = useState<Envio[]>([]);
  const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [aSincronizar, setASincronizar] = useState(false);
  const [erroSync, setErroSync] = useState<string | null>(null);
  const supabaseAtivo = isSupabaseConfigured;

  const falhar = (msg: string) => {
    setErroSync(msg);
    toast(msg + ' ⚠️');
  };

  // ---- carga inicial: tudo vem do Supabase ----
  useEffect(() => {
    if (!supabaseAtivo) {
      setLoaded(true);
      return;
    }
    let cancelado = false;
    const carregar = async () => {
      setASincronizar(true);
      try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase não configurado');
        const [rM, rT, rE, rC] = await Promise.all([
          sb.from('membros').select('*').order('criado_em', { ascending: false }).limit(5000),
          sb.from('templates').select('*').limit(2000),
          sb.from('envios').select('*').order('enviado_em', { ascending: false }).limit(5000),
          sb.from('app_config').select('*').eq('id', 'geral').maybeSingle(),
        ]);
        if (cancelado) return;
        if (rM.error) throw new Error('Membros: ' + rM.error.message);
        if (rT.error) throw new Error('Modelos: ' + rT.error.message);
        if (rE.error) throw new Error('Envios: ' + rE.error.message);
        if (rC.error) throw new Error('Config: ' + rC.error.message);

        setMembrosState((rM.data as unknown as Membro[]) ?? []);

        // Modelos: usa a nuvem; se vazia, semeia; migra textos do horário antigo
        let tpl: Template[];
        if (rT.data && rT.data.length > 0) {
          tpl = (rT.data as unknown as Record<string, unknown>[]).map(deSBTemplate);
          let mudou = false;
          tpl = tpl.map((t) => {
            const mig = TEMPLATE_MIGRATIONS.find((m) => m.de === t.conteudo);
            if (mig) { mudou = true; return { ...t, conteudo: mig.para }; }
            return t;
          });
          if (mudou) {
            const { error } = await sb.from('templates').upsert(tpl.map(paraSBTemplate) as never[], { onConflict: 'id' });
            if (error) throw new Error('Modelos: ' + error.message);
          }
        } else {
          tpl = SEED_TEMPLATES.map((s) => ({ ...s, id: uid('tpl'), isPadrao: true }));
          const { error } = await sb.from('templates').upsert(tpl.map(paraSBTemplate) as never[], { onConflict: 'id' });
          if (error) throw new Error('Modelos: ' + error.message);
        }
        if (cancelado) return;
        setTemplatesState(tpl);

        setEnviosState((rE.data as unknown as Envio[]) ?? []);

        // Config da igreja
        if (rC.data) {
          const d = rC.data as unknown as Record<string, string>;
          let cc: Config = {
            nome_igreja: d.nome_igreja ?? DEFAULT_CONFIG.nome_igreja,
            lider_principal: d.lider_principal ?? '',
            horario_cultos: d.horario_cultos ?? '',
            endereco: d.endereco ?? '',
          };
          if (!cc.horario_cultos || cc.horario_cultos === HORARIO_CULTOS_ANTIGO) {
            cc = { ...cc, horario_cultos: HORARIO_CULTOS_PADRAO };
            const { error } = await sb.from('app_config').upsert(
              { id: 'geral', nome_igreja: cc.nome_igreja, lider_principal: cc.lider_principal, horario_cultos: cc.horario_cultos, endereco: cc.endereco ?? '', atualizado_em: new Date().toISOString() } as never,
              { onConflict: 'id' }
            );
            if (error) throw new Error('Config: ' + error.message);
          }
          if (cancelado) return;
          setConfigState(cc);
        } else {
          const { error } = await sb.from('app_config').upsert(
            { id: 'geral', nome_igreja: DEFAULT_CONFIG.nome_igreja, lider_principal: DEFAULT_CONFIG.lider_principal, horario_cultos: DEFAULT_CONFIG.horario_cultos, endereco: '', atualizado_em: new Date().toISOString() } as never,
            { onConflict: 'id' }
          );
          if (error) throw new Error('Config: ' + error.message);
          if (cancelado) return;
          setConfigState(DEFAULT_CONFIG);
        }
        setErroSync(null);
      } catch (e: unknown) {
        if (!cancelado) falhar(e instanceof Error ? e.message : 'Falha ao ligar ao Supabase');
      } finally {
        if (!cancelado) {
          setASincronizar(false);
          setLoaded(true);
        }
      }
    };
    carregar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- escritas: otimistas, Supabase é a única fonte ----
  const setMembros: Store['setMembros'] = (fn) => {
    const sb = getSupabase();
    if (!sb) { falhar('Supabase não configurado'); return; }
    const proximo = fn(membros);
    const anterior = membros;
    setMembrosState(proximo);
    void (async () => {
      try {
        setASincronizar(true);
        await syncTabela(sb, 'membros', anterior, proximo);
        setErroSync(null);
      } catch { falhar('Falha ao guardar membro no Supabase'); }
      finally { setASincronizar(false); }
    })();
  };

  const setTemplates: Store['setTemplates'] = (fn) => {
    const sb = getSupabase();
    if (!sb) { falhar('Supabase não configurado'); return; }
    const proximo = fn(templates);
    const anterior = templates;
    setTemplatesState(proximo);
    void (async () => {
      try {
        setASincronizar(true);
        await syncTabela(sb, 'templates', anterior, proximo, paraSBTemplate);
        setErroSync(null);
      } catch { falhar('Falha ao guardar modelo no Supabase'); }
      finally { setASincronizar(false); }
    })();
  };

  const setEnvios: Store['setEnvios'] = (fn) => {
    const sb = getSupabase();
    if (!sb) { falhar('Supabase não configurado'); return; }
    const proximo = fn(envios);
    const anterior = envios;
    setEnviosState(proximo);
    void (async () => {
      try {
        setASincronizar(true);
        await syncTabela(sb, 'envios', anterior, proximo);
        setErroSync(null);
      } catch { falhar('Falha ao guardar envio no Supabase'); }
      finally { setASincronizar(false); }
    })();
  };

  const setConfig = (c: Config) => {
    const sb = getSupabase();
    if (!sb) { falhar('Supabase não configurado'); return; }
    setConfigState(c);
    void (async () => {
      try {
        setASincronizar(true);
        const { error } = await sb.from('app_config').upsert(
          { id: 'geral', nome_igreja: c.nome_igreja, lider_principal: c.lider_principal, horario_cultos: c.horario_cultos, endereco: c.endereco ?? '', atualizado_em: new Date().toISOString() } as never,
          { onConflict: 'id' }
        );
        if (error) throw error;
        setErroSync(null);
      } catch { falhar('Falha ao guardar dados da igreja'); }
      finally { setASincronizar(false); }
    })();
  };

  const adicionarMembro: Store['adicionarMembro'] = (m) => {
    const novo: Membro = { ...m, id: uid('mem'), criado_em: new Date().toISOString() };
    setMembros((p) => [novo, ...p]);
    return novo;
  };
  const atualizarMembro = (id: string, patch: Partial<Membro>) =>
    setMembros((p) => p.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removerMembro = (id: string) => {
    setMembros((p) => p.filter((m) => m.id !== id));
  };

  const registarEnvio = (membroId: string, conteudo: string, templateId?: string) => {
    const envio: Envio = {
      id: uid('env'),
      membro_id: membroId,
      template_id: templateId,
      conteudo_final: conteudo,
      enviado_em: new Date().toISOString(),
      respondido: false,
    };
    setEnvios((p) => [envio, ...p]);
    setMembros((p) =>
      p.map((m) =>
        m.id === membroId
          ? { ...m, status: 'contatado', ultima_interacao: new Date().toISOString() }
          : m
      )
    );
  };

  const value = useMemo(
    () => ({
      membros, templates, envios, config, loaded, supabaseAtivo, aSincronizar, erroSync,
      setMembros, setTemplates, setEnvios, setConfig,
      adicionarMembro, atualizarMembro, removerMembro, registarEnvio,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [membros, templates, envios, config, loaded, supabaseAtivo, aSincronizar, erroSync]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}
