'use client';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui/primitives';
import { useSms } from '@/components/sms-modal-provider';
import { STATUS_LABEL } from '@/lib/types';
import { Cake, UserX, Clock, Sparkles, ArrowRight, Smartphone, Users, SendHorizontal, BellRing } from 'lucide-react';
import Link from 'next/link';

function ehAniversarioHojeOu7dias(aniv?: string): { dias: number } | null {
  if (!aniv) return null;
  const d = new Date(aniv);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const esteAno = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
  let diff = Math.round((esteAno.getTime() - hoje.getTime()) / 86400000);
  if (diff < 0) {
    const prox = new Date(hoje.getFullYear() + 1, d.getMonth(), d.getDate());
    diff = Math.round((prox.getTime() - hoje.getTime()) / 86400000);
  }
  return diff <= 7 ? { dias: diff } : null;
}

export default function Hoje() {
  const { membros, envios, loaded, config } = useStore();
  const { abrir } = useSms();

  const dados = useMemo(() => {
    const hojeStr = new Date().toDateString();
    const enviadosHoje = envios.filter((e) => new Date(e.enviado_em).toDateString() === hojeStr);
    const aniversariantes = membros
      .map((m) => ({ m, info: ehAniversarioHojeOu7dias(m.aniversario) }))
      .filter((x) => x.info)
      .sort((a, b) => a.info!.dias - b.info!.dias);
    const ausentes = membros.filter(
      (m) =>
        m.tags.includes('Ausente') ||
        (m.ultima_interacao && Date.now() - new Date(m.ultima_interacao).getTime() > 21 * 86400000)
    );
    const followHoje = membros.filter((m) => {
      if (!m.proximo_contato) return false;
      return new Date(m.proximo_contato).toDateString() === hojeStr;
    });
    const seteDiasAtras = Date.now() - 7 * 86400000;
    const novos = membros.filter((m) => new Date(m.criado_em).getTime() >= seteDiasAtras);
    const pendentes = membros.filter((m) => m.status === 'nao_contatado' || m.status === 'tentativa_feita').length;
    return { enviadosHoje, aniversariantes, ausentes, followHoje, novos, pendentes };
  }, [membros, envios]);

  if (!loaded) {
    return (
      <div className="space-y-3">
        <div className="h-36 animate-pulse rounded-3xl bg-white" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-white" />)}
        </div>
      </div>
    );
  }

  const dataFmt = new Date().toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-3">
      {/* Hero compacto */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink p-4 text-white shadow-card">
        <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full bg-violet-600/50 blur-3xl" />
        <p className="relative text-xs capitalize text-white/60">{dataFmt}</p>
        <h1 className="relative mt-0.5 text-xl font-bold tracking-tight">Olá, vamos cuidar</h1>
        <p className="relative mt-0.5 text-[13px] text-white/70">{config.nome_igreja} · {dados.followHoje.length} follow-ups hoje</p>
        <div className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur">
            <p className="flex items-center gap-1 text-[11px] text-white/60"><Users size={12} /> Membros</p>
            <p className="text-lg font-bold leading-tight">{membros.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur">
            <p className="flex items-center gap-1 text-[11px] text-white/60"><SendHorizontal size={12} /> Hoje</p>
            <p className="text-lg font-bold leading-tight">{dados.enviadosHoje.length}</p>
          </div>
          <div className="rounded-2xl bg-amber-400/90 p-2.5 text-ink">
            <p className="flex items-center gap-1 text-[11px] font-semibold"><BellRing size={12} /> Pendentes</p>
            <p className="text-lg font-bold leading-tight">{dados.pendentes}</p>
          </div>
        </div>
      </section>

      <Card>
        <SectionTitle icon={<Clock size={17} className="text-amber-500" />} title="Follow-ups de hoje" count={dados.followHoje.length} action={dados.followHoje.length > 0 ? <Link href="/agenda" className="text-xs font-bold text-brand-600">Ver tudo</Link> : undefined} />
        {dados.followHoje.length === 0 ? <EmptyState emoji="🎉" title="Nada agendado para hoje" hint="Define o próximo contato no perfil do membro." /> :
          <ul className="space-y-2">{dados.followHoje.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
              <Avatar nome={m.nome} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.nome}</p><p className="text-xs text-slate-500">{m.telefone}</p></div>
              <Button onClick={() => abrir({ membro: m })} className="min-h-[40px] !px-3.5 !py-2 text-xs"><Smartphone size={15} /> SMS</Button>
            </li>))}</ul>}
      </Card>

      <Card>
        <SectionTitle icon={<Cake size={17} className="text-pink-500" />} title="Aniversariantes · 7 dias" count={dados.aniversariantes.length} />
        {dados.aniversariantes.length === 0 ? <EmptyState emoji="🎂" title="Sem aniversários próximos" /> :
          <ul className="space-y-2">{dados.aniversariantes.map(({ m, info }) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-pink-50/70 p-2.5">
              <Avatar nome={m.nome} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-semibold">{m.nome} {info!.dias === 0 && <Badge tone="green">Hoje! 🎉</Badge>}</p>
                <p className="text-xs text-slate-500">{info!.dias === 0 ? 'Faz anos hoje' : `Faz anos em ${info!.dias} dia(s)`}</p>
              </div>
              <Button onClick={() => abrir({ membro: m })} className="min-h-[40px] !px-3.5 !py-2 text-xs"><Smartphone size={15} /> SMS</Button>
            </li>))}</ul>}
      </Card>

      <Card>
        <SectionTitle icon={<UserX size={17} className="text-slate-400" />} title="Ausentes +3 semanas" count={dados.ausentes.length} />
        {dados.ausentes.length === 0 ? <EmptyState emoji="🙌" title="Nenhum membro ausente" /> :
          <ul className="space-y-2">{dados.ausentes.slice(0, 10).map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
              <Avatar nome={m.nome} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.nome}</p><p className="text-xs text-slate-500">{STATUS_LABEL[m.status]}</p></div>
              <Button onClick={() => abrir({ membro: m })} className="min-h-[40px] !px-3.5 !py-2 text-xs"><Smartphone size={15} /> SMS</Button>
            </li>))}</ul>}
      </Card>

      <Card>
        <SectionTitle icon={<Sparkles size={17} className="text-brand-500" />} title="Novos · 7 dias" count={dados.novos.length} />
        {dados.novos.length === 0 ? <EmptyState emoji="✨" title="Sem novos membros" hint="Adiciona visitantes e novos convertidos." /> :
          <ul className="space-y-2">{dados.novos.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-brand-50 p-2.5">
              <Avatar nome={m.nome} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.nome}</p><p className="text-xs text-slate-500">{m.telefone}</p></div>
              <Button onClick={() => abrir({ membro: m })} className="min-h-[40px] !px-3.5 !py-2 text-xs"><Smartphone size={15} /> SMS</Button>
            </li>))}</ul>}
      </Card>

      <Link href="/membros" className="flex min-h-[52px] items-center justify-center gap-2 rounded-3xl bg-white text-sm font-semibold text-brand-700 shadow-card transition active:scale-[.99]">
        Ver todos os membros <ArrowRight size={16} />
      </Link>
    </div>
  );
}
