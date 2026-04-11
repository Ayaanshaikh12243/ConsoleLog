import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, ShieldCheck, Zap, Database, Terminal, ChevronRight, Search } from 'lucide-react';

const AgentsPage = () => {
  const [agents, setAgents] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('CORTEX');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/agents');
        setAgents(res.data);
      } catch (e) {}
    };
    fetchAgents();
  }, []);

  const agentList = [
    { 
        name: 'CORTEX', 
        desc: 'Higher-order cognitive system managing agent orchestration and priority routing.', 
        status: agents?.cortex || 'Active',
        tasks: ['Cross-node correlation', 'Risk escalation strategy', 'Inter-agent sync'],
        load: 68
    },
    { 
        name: 'SENTINEL', 
        desc: 'Distributed reconnaissance fleet identifying real-time raster and sensor anomalies.', 
        status: agents?.sentinel || 'Active',
        tasks: ['Raster anomaly detection', 'H3 grid indexing', 'Thermal trace monitoring'],
        load: 84
    },
    { 
        name: 'PROBE', 
        desc: 'Deep investigative units deployed to confirm sub-surface infrastructure integrity.', 
        status: agents?.probes || 'Active',
        tasks: ['Sensor verify', 'Data payload validation', 'Local node ping'],
        load: 32
    },
    { 
        name: 'ORACLE', 
        desc: 'Massive simulation engine calculating predictive models and failure likelihood.', 
        status: 'Idle',
        tasks: ['Monte Carlo simulations', 'Future trend projection', 'Predictive weighting'],
        load: 12
    },
  ];

  return (
    <div className="p-8 lg:p-12 min-h-full space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Multi-Agent Intelligence Fleet</h2>
          <div className="flex items-center space-x-3 text-white/40">
             <span className="text-[10px] font-bold uppercase tracking-widest">Global Status: Operational</span>
             <div className="w-1.5 h-1.5 bg-risk-low rounded-full"></div>
             <span className="text-[10px] font-bold uppercase tracking-widest">4 Units Online</span>
          </div>
        </div>
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Query Agent Protocols..." 
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-stratum-accent transition-all w-80 shadow-2xl"
            />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Agent Cards Dashboard */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentList.map((agent, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedAgent(agent.name)}
                className={`glass-panel p-8 rounded-[2.5rem] border group transition-all cursor-pointer relative overflow-hidden ${
                    selectedAgent === agent.name ? 'border-stratum-accent bg-stratum-accent/5' : 'border-white/5 hover:border-white/20'
                }`}
            >
                <div className="flex items-center justify-between mb-8">
                    <div className={`p-4 rounded-2xl ${selectedAgent === agent.name ? 'bg-stratum-accent text-black' : 'bg-white/5 text-stratum-accent'}`}>
                        <Cpu className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Compute Load</p>
                        <p className="text-xl font-black text-white">{agent.load}%</p>
                    </div>
                </div>

                <h3 className="text-lg font-black text-white mb-2 tracking-tight uppercase">{agent.name}</h3>
                <p className="text-[11px] text-white/40 leading-relaxed min-h-[4rem]">{agent.desc}</p>
                
                <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${agent.status === 'Idle' ? 'bg-white/10' : 'bg-risk-low'}`}></div>
                        <span className="text-[10px] font-black uppercase text-white/60">{agent.status}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedAgent === agent.name ? 'text-stratum-accent translate-x-1' : 'text-white/20'}`} />
                </div>
            </motion.div>
            ))}
        </div>

        {/* Selected Agent Details / Console */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 flex flex-col h-[35rem] xl:h-auto">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-10">Intelligence protocol: {selectedAgent}</h3>
            
            <div className="space-y-10 flex-1">
                <section>
                    <div className="flex items-center space-x-3 mb-4 text-stratum-accent">
                        <Zap className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Active Processes</h4>
                    </div>
                    <div className="space-y-3">
                        {agentList.find(a => a.name === selectedAgent).tasks.map((task, i) => (
                            <div key={i} className="flex items-center space-x-3 text-[11px] text-white/70 bg-white/5 p-4 rounded-2xl border border-white/5 font-medium">
                                <div className="w-1 h-1 bg-stratum-accent rounded-full"></div>
                                <span>{task}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center space-x-3 mb-4 text-white/30">
                        <Terminal className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Console Stream</h4>
                    </div>
                    <div className="bg-black/80 rounded-2xl p-6 font-mono text-[10px] text-risk-low space-y-2 border border-white/5 overflow-hidden">
                        <p className="opacity-40">:: Initialize connection...</p>
                        <p>:: Handshake confirmed with {selectedAgent}-FLEET-7</p>
                        <p className="animate-pulse">:: Analyzing node variance [0.0023]...</p>
                        <p>:: Sub-surface ping: OK</p>
                    </div>
                </section>
            </div>

            <button className="mt-10 w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:bg-stratum-accent hover:text-black transition-all">
                Reset Agent Core
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
