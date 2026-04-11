import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, ShieldAlert, Cpu, Activity, Trash2, Zap } from 'lucide-react';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/alerts');
                setAlerts(res.data);
            } catch (err) {
                console.error("Failed to fetch alerts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/alerts/${id}`);
            setAlerts(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div className="p-10 space-y-10">
            <header>
                <div className="flex items-center space-x-4 mb-2">
                    <div className="p-3 rounded-2xl bg-risk-high/10 text-risk-high">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Alerts</h1>
                        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">Autonomous detection log</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {alerts.length > 0 ? (
                        alerts.map((alert, idx) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative glass-panel p-6 rounded-[2.5rem] border border-white/5 hover:border-risk-high/30 transition-all duration-500 overflow-hidden"
                            >
                                {/* Risk Gradient Background */}
                                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 ${
                                    alert.risk > 70 ? 'bg-risk-high' : 'bg-risk-medium'
                                }`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-xl bg-white/5 ${alert.risk > 70 ? 'text-risk-high' : 'text-risk-medium'}`}>
                                                <ShieldAlert className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Protocol</span>
                                                     <div className="px-2 py-0.5 rounded-full bg-stratum-accent/10 border border-stratum-accent/20 flex items-center gap-1">
                                                         <Zap className="w-2 h-2 text-stratum-accent" />
                                                         <span className="text-[8px] font-black text-stratum-accent uppercase">{alert.trigger || 'Anomaly'}</span>
                                                     </div>
                                                </div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tight">{alert.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-white tracking-tighter">{alert.risk}%</span>
                                            </div>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Risk Factor</p>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-black/20 rounded-2xl border border-white/5 mb-6 group-hover:bg-risk-high/5 transition-all duration-500 relative">
                                        <p className="text-sm font-bold text-white/90 leading-relaxed italic uppercase pr-8">
                                            "{alert.message}"
                                        </p>
                                        <button 
                                            onClick={() => handleDelete(alert.id)}
                                            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-white/20 hover:bg-risk-high hover:text-white transition-all shadow-xl"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="mt-auto grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-3 h-3 text-stratum-accent" />
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-tight truncate">{alert.location}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 justify-end">
                                            <Clock className="w-3 h-3 text-white/20" />
                                            <span className="text-[10px] font-mono text-white/40">{new Date(alert.time).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <Cpu className="w-12 h-12 text-white/5 mx-auto mb-4 animate-pulse" />
                            <p className="text-white/20 font-black uppercase tracking-widest">No active anomalies detected in current buffer</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AlertsPage;
