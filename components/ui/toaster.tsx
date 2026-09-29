'use client';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Toast { id: number; msg: string }

let pushFn: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  pushFn?.(msg);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, msg }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);
  pushFn = push;
  return (
    <div className="pointer-events-none fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <div key={t.id} className={cn('pointer-events-auto w-full rounded-2xl bg-ink px-4 py-3 text-center text-sm font-medium text-white shadow-card')}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
