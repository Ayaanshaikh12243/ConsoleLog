import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Database, Clock, Search, Filter } from 'lucide-react';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/anomalies');
            setLogs(res.data);
        } catch (e) {}
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-10 bg-stratum-dark min-h-full">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Event Log History</h2>
                <p className="text-white/40 text-sm">Auditable trail of all planetary anomalies and system triggers.</p>
            </div>
            <div className="flex items-center space-x-3">
                <button className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all border border-white/5">
                    <Filter className="w-5 h-5" />
                </button>
            </div>
        </header>

        <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Timestamp</th>
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Anomaly ID</th>
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Message</th>
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">System Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log, i) => (
                        <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={log.id} 
                            className="border-b border-white/5 hover:bg-white/3 transition-all cursor-crosshair group"
                        >
                            <td className="p-6 text-xs text-white/30 font-mono">{log.time}</td>
                            <td className="p-6 text-sm font-bold text-stratum-accent">EVT-00{log.id}</td>
                            <td className="p-6 text-sm text-white/80">{log.msg}</td>
                            <td className="p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-4/5 h-full bg-risk-low"></div>
                                    </div>
                                    <span className="text-[10px] font-black text-risk-low">92.4%</span>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
