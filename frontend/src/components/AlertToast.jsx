import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Zap } from 'lucide-react';

const RISK_COLOR = (risk) => {
  if (risk > 70) return { bg: 'bg-red-500/10',   border: 'border-red-500/40',   text: 'text-red-400'    };
  if (risk > 35) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400' };
  return              { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',   text: 'text-cyan-400'   };
};

const AlertToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const es = new EventSource('http://localhost:8000/api/alerts/stream');

    es.onmessage = (e) => {
      try {
        const alert = JSON.parse(e.data);
        const id = `${alert.id}-${Date.now()}`;
        setToasts(prev => [{ ...alert, _toastId: id }, ...prev].slice(0, 4));

        // Auto-dismiss after 6s
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t._toastId !== id));
        }, 6000);
      } catch {}
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  const dismiss = (toastId) =>
    setToasts(prev => prev.filter(t => t._toastId !== toastId));

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => {
          const c = RISK_COLOR(toast.risk);
          return (
            <motion.div
              key={toast._toastId}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0,    opacity: 1 }}
              exit={{    x: -100, opacity: 0 }}
              className={`relative p-4 rounded-2xl border glass-panel ${c.bg} ${c.border} shadow-2xl overflow-hidden`}
            >
              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${c.text.replace('text', 'bg')}`}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg bg-white/5 ${c.text} mt-0.5`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>
                        AUTO-DETECT
                      </span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                        <Zap className="w-2 h-2 text-white/40" />
                        <span className="text-[8px] font-black text-white/40 uppercase">
                          {toast.disaster_type || toast.trigger}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{toast.location}</p>
                    <p className={`text-lg font-black ${c.text}`}>{toast.risk}% Risk</p>
                    <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{toast.message?.substring(0, 80)}…</p>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(toast._toastId)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AlertToast;