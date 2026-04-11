import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Database, Activity } from 'lucide-react';

const SystemLogs = () => {
  const logs = [
    { time: 'T-04:22', msg: 'H3 Grid Sector 882a107289 sync complete', level: 'SUCCESS' },
    { time: 'T-03:45', msg: 'ORACLE simulation propagated to SCRIBE', level: 'INFO' },
    { time: 'T-02:12', msg: 'SENTINEL cross-referencing node signals', level: 'PROCESS' },
    { time: 'T-00:58', msg: 'Global Anomaly Baseline updated (+0.4%)', level: 'SUCCESS' },
    { time: 'T-00:12', msg: 'Inference engine status: OPTIMIZED', level: 'INFO' },
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-stratum-accent" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Signal Feed</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-risk-low animate-pulse"></div>
          <div className="w-1 h-1 rounded-full bg-risk-low animate-pulse delay-75"></div>
          <div className="w-1 h-1 rounded-full bg-risk-low animate-pulse delay-150"></div>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 group"
          >
            <span className="text-[8px] font-mono text-stratum-accent/40 w-12 pt-0.5 shrink-0">{log.time}</span>
            <div className="flex-1">
               <p className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors leading-relaxed">
                 {log.msg}
               </p>
               <div className="h-[1px] w-0 group-hover:w-full bg-stratum-accent/10 transition-all duration-500 mt-2"></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Database className="w-3 h-3 text-white/20" />
           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">PostgreSQL persistent</span>
         </div>
         <div className="flex items-center gap-2">
           <Activity className="w-3 h-3 text-white/20" />
           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Inference: 142ms</span>
         </div>
      </div>
    </div>
  );
};

export default SystemLogs;
