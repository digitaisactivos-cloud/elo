'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft' | 'success';

export function Button({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v = (p as { variant?: string }).variant ?? 'primary';
  const { variant: _v, ...rest } = p as Record<string, unknown>;
  const styles =
    v === 'primary'
      ? 'bg-brand-600 text-white shadow-fab hover:bg-brand-700 active:scale-[.98]'
      : v === 'success'
        ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[.98]'
        : v === 'danger'
          ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[.98]'
          : v === 'outline'
            ? 'border border-slate-200 bg-white text-ink hover:bg-slate-50 active:scale-[.98]'
            : v === 'soft'
              ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 active:scale-[.98]'
              : 'text-slate-600 hover:bg-slate-100 active:scale-[.98]';
  return <button {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={cn('touch-manip inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50', styles, className)} />;
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn('rounded-3xl border border-white/60 bg-white p-4 shadow-card', className)} />;
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn('h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 md:text-sm', className)} />;
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[16px] outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 md:text-sm', className)} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.08em] text-slate-500">{children}</label>;
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'brand' }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-sky-100 text-sky-800',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-rose-100 text-rose-700',
    purple: 'bg-violet-100 text-violet-700',
    brand: 'bg-brand-100 text-brand-700',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', map[tone])}>{children}</span>;
}

export function SelectNative({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn('h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 md:text-sm', className)} />;
}

const AVATAR_BG = [
  'bg-violet-500', 'bg-indigo-500', 'bg-fuchsia-500', 'bg-rose-500',
  'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-orange-500',
];

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  const iniciais = (nome || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  let h = 0;
  for (const c of nome || '?') h = (h * 31 + c.charCodeAt(0)) % 997;
  const bg = AVATAR_BG[h % AVATAR_BG.length];
  return (
    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white', bg, className)}>
      {iniciais}
    </span>
  );
}

export function SectionTitle({ icon, title, count, action }: { icon?: React.ReactNode; title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
        {icon}
        {title}
        {typeof count === 'number' && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{count}</span>
        )}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-[26ch] text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Fab({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={cn(
        'touch-manip fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-14 min-h-0 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-fab transition active:scale-95 md:bottom-8 md:right-8',
        className
      )}
    />
  );
}
