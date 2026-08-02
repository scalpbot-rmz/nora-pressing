'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast:   (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error:   (title: string, description?: string) => void;
  info:    (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error:   <XCircle      className="w-5 h-5 text-rose-500 shrink-0" />,
  info:    <Info         className="w-5 h-5 text-blue-500 shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-rose-200   bg-rose-50',
  info:    'border-blue-200   bg-blue-50',
};

function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onRemove(t.id), 260);
  };

  // Auto-dismiss
  useState(() => {
    const timer = setTimeout(dismiss, t.duration ?? 4000);
    return () => clearTimeout(timer);
  });

  return (
    <div className={`relative flex items-start gap-3 px-4 py-3 pr-10 rounded-2xl border shadow-xl max-w-sm w-full
      ${STYLES[t.type]}
      ${leaving ? 'animate-slide-out' : 'animate-slide-in'}`}
    >
      {ICONS[t.type]}
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-tight">{t.title}</p>
        {t.description && <p className="text-xs text-slate-600 mt-0.5 leading-snug">{t.description}</p>}
      </div>
      <button
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast:   add,
    success: (title, description) => add({ type: 'success', title, description }),
    error:   (title, description) => add({ type: 'error',   title, description }),
    info:    (title, description) => add({ type: 'info',    title, description }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Portail toasts — coin bas-droit, au-dessus de la bottom nav mobile */}
      <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
