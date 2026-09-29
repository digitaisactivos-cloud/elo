'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Config, Envio, Membro, Template } from '@/lib/types';
import { SEED_TEMPLATES, TEMPLATE_MIGRATIONS, HORARIO_CULTOS_PADRAO, HORARIO_CULTOS_ANTIGO } from '@/lib/seed-templates';
import { uid } from '@/lib/utils';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const K_MEMBROS = 'acompanhamais:membros:v1';
const K_TEMPLATES = 'acompanhamais:templates:v1';
const K_ENVIOS = 'acompanhamais:envios:v1';
const K_CONFIG = 'acompanhamais:config:v1';

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

function ler<T>(k: string, fb: T): T {
  try {
    const raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fb;
}

const DEFAULT_CONFIG: Config = {
  nome_igreja: 'Igreja Evangélica',
  lider_principal: '',
  horario_cultos: HORARIO_CULTOS_PADRAO,
  endereco: '',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [membros, setMembrosState] = useState<Membro[]>([]);
  const [templates, setTemplatesState] = useState<Template[]>([]);
  const [envios, setEnviosState] = useState<Envio[]>([]);
  const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [aSincronizar, setASincronizar] = useState(false);
  const [erroSync, setErroSync] = useState<string | null>(null);
  const supabaseAtivo = isSupabaseConfigured;
  const aCarregarNuvem = useRef(false);

  // ---- helpers Supabase (fire-and-forget, nunca bloqueiam a UI) ----
  const sbUpsert = async (tabela: 'membros' | 'templates' | 'envios', linhas: unknown[]) => {
    if (!supabaseAtivo || linhas.length === 0 || aCarregarNuvem.current) return;
    try {
      setASincronizar(true);
      const sb = getSupabase();
      if (!sb) return;
      // upsert em lotes de 200
      for (let i = 0; i < linhas.length; i += 200) {
        const lote = linhas.slice(i, i + 200);
        const { error } = await sb.from(tabela).upsert(lote as never[], { onConflict: 'id' });
        if (error) throw error;
      }
      setErroSync(null);
    } catch (e: unknown) {
      setErroSync(e instanceof Error ? e.message : 'Falha ao sincronizar com Supabase');
    } finally {
      setASincronizar(false);
    }
  };

  const sbApagar = async (tabela: 'membros' | 'templates' | 'envios', id: string) => {
    if (!supabaseAtivo) return;
    try {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from(tabela).delete().eq('id', id);
    } catch (e: unknown) {
      setErroSync(e instanceof Error ? e.message : 'Falha ao apagar no Supabase');
    }
  };

  const sbGuardarConfig = async (c: Config) => {
    if (!supabaseAtivo || aCarregarNuvem.current) return;
    try {
      setASincronizar(true);
      const sb = getSupabase();
      if (!sb) return;
      const { error } = await sb.from('app_config').upsert(
        { id: 'geral', nome_igreja: c.nome_igreja, lider_principal: c.lider_principal, horario_cultos: c.horario_cultos, endereco: c.endereco ?? '', atualizado_em: new Date().toISOString() } as never,
        { onConflict: 'id' }
      );
      if (error) throw error;
      setErroSync(null);
    } catch (e: unknown) {
      setErroSync(e instanceof Error ? e.message : 'Falha ao guardar config no Supabase');
    } finally {
      setASincronizar(false);
    }
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

  /** Migração 1x para o novo horário (só toca em textos padrão não editados) */
  const migrarTemplates = (lista: Template[]): { lista: Template[]; mudou: boolean } => {
    let mudou = false;
    const nova = lista.map((tpl) => {
      const mig = TEMPLATE_MIGRATIONS.find((m) => m.de === tpl.conteudo);
      if (mig) { mudou = true; return { ...tpl, conteudo: mig.para }; }
      return tpl;
    });
    return { lista: nova, mudou };
  };

  const migrarHorario = (c: Config): { config: Config; mudou: boolean } => {
    if (!c.horario_cultos || c.horario_cultos === HORARIO_CULTOS_ANTIGO) {
      return { config: { ...c, horario_cultos: HORARIO_CULTOS_PADRAO }, mudou: true };
    }
    return { config: c, mudou: false };
  };

  const persist = (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };

  useEffect(() => {
    let cancelado = false;
    const iniciar = async () => {
      // 1) cache local primeiro (rápido + offline)
      let t = ler<Template[]>(K_TEMPLATES, []);
      if (!t || t.length === 0) {
        t = SEED_TEMPLATES.map((s) => ({ ...s, id: uid('tpl'), isPadrao: true }));
      }
      const migLocal = migrarTemplates(t);
      t = migLocal.lista;
      persist(K_TEMPLATES, t);
      const mLocal = ler<Membro[]>(K_MEMBROS, []);
      const eLocal = ler<Envio[]>(K_ENVIOS, []);
      let cLocal = ler<Config>(K_CONFIG, DEFAULT_CONFIG);
      const migHor = migrarHorario(cLocal);
      cLocal = migHor.config;
      if (migLocal.mudou || migHor.mudou) persist(K_CONFIG, cLocal);
      if (cancelado) return;
      setTemplatesState(t);
      setMembrosState(mLocal);
      setEnviosState(eLocal);
      setConfigState(cLocal);
      setLoaded(true);

      // 2) se Supabase configurado, puxar nuvem e reconciliar
      if (!supabaseAtivo) return;
      const sb = getSupabase();
      if (!sb) return;
      try {
        aCarregarNuvem.current = true;
        setASincronizar(true);
        const [rM, rT, rE, rC] = await Promise.all([
          sb.from('membros').select('*').limit(5000),
          sb.from('templates').select('*').limit(2000),
          sb.from('envios').select('*').order('enviado_em', { ascending: false }).limit(5000),
          sb.from('app_config').select('*').eq('id', 'geral').maybeSingle(),
        ]);
        if (cancelado) return;
        if (!rM.error && rM.data && rM.data.length > 0) {
          setMembrosState(rM.data as unknown as Membro[]);
          persist(K_MEMBROS, rM.data);
        } else if (!rM.error && (rM.data?.length ?? 0) === 0 && mLocal.length > 0) {
          // primeira vez: subir cache local
          await sb.from('membros').upsert(mLocal as never[], { onConflict: 'id' });
        }
        if (!rT.error && rT.data && rT.data.length > 0) {
          let conv = (rT.data as unknown as Record<string, unknown>[]).map(deSBTemplate);
          const mig = migrarTemplates(conv);
          conv = mig.lista;
          setTemplatesState(conv);
          persist(K_TEMPLATES, conv);
          if (mig.mudou) {
            try { await sb.from('templates').upsert(conv.map(paraSBTemplate) as never[], { onConflict: 'id' }); } catch {}
          }
        } else if (!rT.error && (rT.data?.length ?? 0) === 0) {
          await sb.from('templates').upsert(t.map(paraSBTemplate) as never[], { onConflict: 'id' });
        }
        if (!rE.error && rE.data) {
          setEnviosState(rE.data as unknown as Envio[]);
          persist(K_ENVIOS, rE.data);
        } else if (eLocal.length > 0) {
          await sb.from('envios').upsert(eLocal as never[], { onConflict: 'id' });
        }
        if (!rC.error && rC.data) {
          const d = rC.data as unknown as Record<string, string>;
          let cc: Config = {
            nome_igreja: d.nome_igreja ?? DEFAULT_CONFIG.nome_igreja,
            lider_principal: d.lider_principal ?? '',
            horario_cultos: d.horario_cultos ?? '',
            endereco: d.endereco ?? '',
          };
          const migC = migrarHorario(cc);
          cc = migC.config;
          setConfigState(cc);
          persist(K_CONFIG, cc);
          if (migC.mudou) {
            try {
              await sb.from('app_config').upsert(
                { id: 'geral', nome_igreja: cc.nome_igreja, lider_principal: cc.lider_principal, horario_cultos: cc.horario_cultos, endereco: cc.endereco ?? '', atualizado_em: new Date().toISOString() } as never,
                { onConflict: 'id' }
              );
            } catch {}
          }
        } else if (cLocal) {
          await sbGuardarConfig(cLocal);
        }
        setErroSync(null);
      } catch (e: unknown) {
        if (!cancelado) setErroSync(e instanceof Error ? e.message : 'Falha ao ligar ao Supabase');
      } finally {
        aCarregarNuvem.current = false;
        if (!cancelado) setASincronizar(false);
      }
    };
    iniciar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMembros: Store['setMembros'] = (fn) => {
    const proximo = fn(membros);
    setMembrosState(proximo);
    persist(K_MEMBROS, proximo);
    void sbUpsert('membros', proximo);
  };
  const setTemplates: Store['setTemplates'] = (fn) => {
    const proximo = fn(templates);
    setTemplatesState(proximo);
    persist(K_TEMPLATES, proximo);
    void sbUpsert('templates', proximo.map(paraSBTemplate));
  };
  const setEnvios: Store['setEnvios'] = (fn) => {
    const proximo = fn(envios);
    setEnviosState(proximo);
    persist(K_ENVIOS, proximo);
    void sbUpsert('envios', proximo);
  };
  const setConfig = (c: Config) => {
    setConfigState(c);
    persist(K_CONFIG, c);
    void sbGuardarConfig(c);
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
    void sbApagar('membros', id);
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
