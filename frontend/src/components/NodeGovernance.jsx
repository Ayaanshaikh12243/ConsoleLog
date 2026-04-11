import React from 'react';
import { motion } from 'framer-motion';
import { Box, Globe, Cpu, Signal } from 'lucide-react';

const NodeGovernance = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-6 mt-8"
    >
      <div className="flex items-center gap-3">
        <Globe className="w-4 h-4 text-stratum-accent" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Sector Governance</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-stratum-accent/10 rounded-lg">
               <Cpu className="w-3 h-3 text-stratum-accent" />
             </div>
             <div>
               <p className="text-[8px] text-white/20 uppercase font-black">Node Health</p>
               <p className="text-[10px] font-black text-white">OPTIMIZED</p>
             </div>
           </div>
           <Signal className="w-3 h-3 text-risk-low animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
             <p className="text-[7px] text-white/20 uppercase font-black mb-1">Sector Sync</p>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono text-white/80">99.8%</span>
               <div className="w-1 h-1 rounded-full bg-risk-low"></div>
             </div>
           </div>
           <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
             <p className="text-[7px] text-white/20 uppercase font-black mb-1">Latency</p>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono text-white/80">14ms</span>
               <div className="w-1 h-1 rounded-full bg-risk-low"></div>
             </div>
           </div>
        </div>

        <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-3 h-3 text-white/20" />
              <span className="text-[8px] font-black text-white/20 uppercase">H3 Resolution Level</span>
            </div>
            <span className="text-[10px] font-black text-stratum-accent">RES-08</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
         <p className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-relaxed">
           Your node is currently participating in consensus for Sector 882a107289. Your corroboration weight is active.
         </p>
      </div>
    </motion.div>
  );
};

export default NodeGovernance;
