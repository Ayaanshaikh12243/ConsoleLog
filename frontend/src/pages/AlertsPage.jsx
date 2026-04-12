import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Clock, MapPin, ShieldAlert, Cpu,
  Trash2, Zap, ChevronDown, ChevronUp, FileText, Wrench
} from 'lucide-react';

const AlertsPage = () => {
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [expanded, setExpanded] = useState({});

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/alerts');
      setAlerts(Array.isArray(res.data) ? res.data : res.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = alerts.filter(a => {
    if (filter === 'ALL')      return true;
    if (filter === 'CRITICAL') return a.risk > 70;
    if (filter === 'WARNING')  return a.risk > 35 && a.risk <= 70;
    return true;
  });

  const autoCount = alerts.filter(a =>
    !a.trigger || a.trigger === 'EARTHQUAKE' || a.trigger === 'AUTO'
  ).length;

  return (
    <div className="p-10 space-y-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-risk-high/10 text-risk-high">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              System Alerts
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">
                Autonomous detection log — {alerts.length} active
              </p>
              {/* Live monitor badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                  Monitor Active
                </span>
              </div>
              {/* Auto-detect count */}
              {autoCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stratum-accent/10 border border-stratum-accent/20">
                  <Zap className="w-2.5 h-2.5 text-stratum-accent" />
                  <span className="text-[9px] font-black text-stratum-accent uppercase tracking-widest">
                    {autoCount} Auto-Detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'CRITICAL', 'WARNING'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? f === 'CRITICAL' ? 'bg-risk-high/20   border-risk-high   text-risk-high'
                  : f === 'WARNING'  ? 'bg-risk-medium/20 border-risk-medium text-risk-medium'
                  :                   'bg-stratum-accent/20 border-stratum-accent text-stratum-accent'
                  : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'
              }`}
            >
              {f}
              <span className="ml-1.5 opacity-50">
                {f === 'ALL'      ? alerts.length
                : f === 'CRITICAL' ? alerts.filter(a => a.risk > 70).length
                : alerts.filter(a => a.risk > 35 && a.risk <= 70).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Alert Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filtered.length > 0 ? (
            filtered.map((alert, idx) => {
              const isAuto = !alert.trigger || alert.trigger === 'EARTHQUAKE' || alert.trigger === 'AUTO';
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.07 }}
                  className="group relative glass-panel rounded-[2.5rem] border border-white/5 hover:border-risk-high/30 transition-all duration-500 overflow-hidden"
                >
                  {/* Risk glow */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 ${
                    alert.risk > 70 ? 'bg-risk-high' : 'bg-risk-medium'
                  }`} />

                  <div className="relative z-10 p-6 space-y-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl bg-white/5 ${
                          alert.risk > 70 ? 'text-risk-high' : 'text-risk-medium'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          {/* Badge row */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              {alert.disaster_type || 'Anomaly'}
                            </span>
                            <div className="px-2 py-0.5 rounded-full bg-stratum-accent/10 border border-stratum-accent/20 flex items-center gap-1">
                              <Zap className="w-2 h-2 text-stratum-accent" />
                              <span className="text-[8px] font-black text-stratum-accent uppercase">
                                {alert.trigger || 'MANUAL'}
                              </span>
                            </div>
                            {/* AUTO-DETECT badge */}
                            {isAuto && (
                              <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">
                                  AUTO-DETECT
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white uppercase tracking-tight">
                            {alert.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-white">{alert.risk}%</span>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Risk</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 relative">
                      <p className="text-sm font-bold text-white/80 leading-relaxed pr-8">
                        {alert.message}
                      </p>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-white/20 hover:bg-risk-high hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Expand briefs toggle */}
                    {(alert.minister_brief || alert.engineer_brief) && (
                      <button
                        onClick={() => toggleExpand(alert.id)}
                        className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-stratum-accent/30 transition-all"
                      >
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                          Intelligence Briefs
                        </span>
                        {expanded[alert.id]
                          ? <ChevronUp className="w-3 h-3 text-white/30" />
                          : <ChevronDown className="w-3 h-3 text-white/30" />
                        }
                      </button>
                    )}

                    {/* Expanded briefs */}
                    <AnimatePresence>
                      {expanded[alert.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          {alert.minister_brief && (
                            <div className="p-4 rounded-2xl bg-stratum-accent/5 border border-stratum-accent/20">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3 h-3 text-stratum-accent" />
                                <span className="text-[8px] font-black text-stratum-accent uppercase tracking-widest">
                                  Minister Brief
                                </span>
                              </div>
                              <p className="text-[11px] text-white/70 leading-relaxed">
                                {alert.minister_brief}
                              </p>
                            </div>
                          )}
                          {alert.engineer_brief && (
                            <div className="p-4 rounded-2xl bg-risk-medium/5 border border-risk-medium/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Wrench className="w-3 h-3 text-risk-medium" />
                                <span className="text-[8px] font-black text-risk-medium uppercase tracking-widest">
                                  Engineer Brief
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">
                                {alert.engineer_brief}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-stratum-accent" />
                        <span className="text-[10px] font-black text-white/60 truncate">
                          {alert.location}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 justify-end">
                        <Clock className="w-3 h-3 text-white/20" />
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(alert.time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <Cpu className="w-12 h-12 text-white/5 mx-auto mb-4 animate-pulse" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">
                No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}alerts in current buffer
              </p>
              <p className="text-white/10 text-xs mt-2 font-mono uppercase tracking-widest">
                Autonomous monitor scanning India zones every 90s…
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertsPage;