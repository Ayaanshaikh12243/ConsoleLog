import React, { useState, useEffect } from 'react';
import { Shield, Activity, Globe, Menu, Bell, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

const Header = () => {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/alerts`);
            setAlerts(res.data);
        } catch (e) {}
    };
    fetchAlerts();
  }, []);

  return (
    <header className="z-[60] h-16 glass-panel border-b border-white/10 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center space-x-3">
        <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-stratum-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] cursor-pointer"
        >
          <Shield className="text-black w-6 h-6" />
        </motion.div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white">STRATUM</h1>
          <p className="text-[8px] text-stratum-accent tracking-[0.2em] uppercase font-black opacity-80">Autonomous Planetary Intel</p>
        </div>
      </div>

      <nav className="hidden md:flex items-center space-x-10 text-[10px] font-black uppercase tracking-widest text-white/40">
        <NavLink to="/" className={({ isActive }) => isActive ? "text-stratum-accent border-b-2 border-stratum-accent pb-1" : "hover:text-white transition-colors duration-300"}>Real-time Map</NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? "text-stratum-accent border-b-2 border-stratum-accent pb-1" : "hover:text-white transition-colors duration-300"}>Risk Analytics</NavLink>
        <NavLink to="/agents" className={({ isActive }) => isActive ? "text-stratum-accent border-b-2 border-stratum-accent pb-1" : "hover:text-white transition-colors duration-300"}>Agent Fleet</NavLink>
        <NavLink to="/submissions" className={({ isActive }) => isActive ? "text-stratum-accent border-b-2 border-stratum-accent pb-1" : "hover:text-white transition-colors duration-300"}>Submissions</NavLink>
      </nav>

      <div className="flex items-center space-x-6">
        <div className="hidden sm:flex items-center space-x-2 px-4 py-1.5 bg-risk-low/10 rounded-full border border-risk-low/20">
          <div className="w-1.5 h-1.5 bg-stratum-risk-low rounded-full animate-pulse"></div>
          <span className="text-[10px] text-stratum-risk-low marker:font-black uppercase tracking-widest">System Synchronized</span>
        </div>

        <div className="relative">
            <button 
                onClick={() => setAlertsOpen(!alertsOpen)}
                className="relative p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10"
            >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-risk-high rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-stratum-dark">
                {alerts.length}
            </span>
            </button>

            <AnimatePresence>
            {alertsOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-80 bg-stratum-dark border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden z-[70]"
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Anomalies</span>
                        <span className="text-[10px] font-bold text-stratum-accent cursor-pointer">Clear All</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {alerts.map(alert => (
                            <div key={alert.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3 group hover:border-white/20 transition-all">
                                <Activity className={`w-4 h-4 mt-0.5 ${alert.severity === 'error' ? 'text-risk-high' : 'text-risk-medium'}`} />
                                <div className="flex-1">
                                    <p className="text-[11px] text-white/80 font-medium">{alert.msg}</p>
                                    <p className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-wider">{alert.time} • Global Feed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
        
        <button className="lg:hidden p-2 text-white/60 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
