'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, MessagesSquare, CalendarDays, Settings, Church } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const ITEMS = [
  { href: '/', label: 'Início', icon: LayoutGrid },
  { href: '/membros', label: 'Membros', icon: Users },
  { href: '/mensagens', label: 'SMS', icon: MessagesSquare },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/config', label: 'Ajustes', icon: Settings },
];

export function Nav() {
  const path = usePathname();
  const { membros } = useStoreSafe();

  const pendentes = membros.filter((m) => {
    if (!m.proximo_contato) return false;
    return new Date(m.proximo_contato) <= new Date();
  }).length;

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col bg-white/80 p-4 backdrop-blur md:flex">
        <div className="mb-6 flex items-center gap-3 rounded-3xl bg-ink p-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Church size={22} />
          </span>
          <div>
            <p className="font-bold leading-tight">Acompanha+</p>
            <p className="text-xs text-white/60">Follow-up da igreja</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((it) => {
            const active = path === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition',
                  active ? 'bg-brand-600 text-white shadow-fab' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <it.icon size={19} />
                {it.label}
                {it.href === '/agenda' && pendentes > 0 && (
                  <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink">{pendentes}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto rounded-2xl bg-brand-50 p-3 text-xs text-brand-700">
          Dica: instala como app — Chrome ⋮ → Adicionar ao ecrã principal.
        </p>
      </aside>

      {/* Bottom nav mobile — estilo app */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto max-w-xl px-3 pb-[calc(.6rem+env(safe-area-inset-bottom,0px))]">
          <div className="grid grid-cols-5 gap-1 rounded-[1.75rem] border border-white/60 bg-white/90 p-1.5 shadow-card backdrop-blur-xl">
            {ITEMS.map((it) => {
              const active = path === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    'touch-manip flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition active:scale-95',
                    active ? 'bg-brand-600 text-white shadow-fab' : 'text-slate-500'
                  )}
                >
                  <span className="relative">
                    <it.icon size={21} strokeWidth={active ? 2.4 : 2} />
                    {it.href === '/agenda' && pendentes > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-ink">
                        {pendentes}
                      </span>
                    )}
                  </span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

    </>
  );
}

function useStoreSafe() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStore();
  } catch {
    return { membros: [] as never[] };
  }
}
