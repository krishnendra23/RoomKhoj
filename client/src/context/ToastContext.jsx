import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 3800) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error', 4800),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const styles =
              item.type === 'success'
                ? 'bg-white border-[#16A34A]/30 text-[#0F172A]'
                : item.type === 'error'
                ? 'bg-white border-red-200 text-[#0F172A]'
                : 'bg-white border-[#2563EB]/25 text-[#0F172A]';

            const Icon =
              item.type === 'success'
                ? CheckCircle2
                : item.type === 'error'
                ? AlertCircle
                : Info;

            const iconColor =
              item.type === 'success'
                ? 'text-[#16A34A]'
                : item.type === 'error'
                ? 'text-red-600'
                : 'text-[#2563EB]';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/10 ${styles}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <p className="text-sm font-medium leading-snug flex-1">{item.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  aria-label="Dismiss notification"
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
