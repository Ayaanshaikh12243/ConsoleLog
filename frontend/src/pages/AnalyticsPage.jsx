import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    ResponsiveContainer,
    LineChart, Line,
    Cell as ReCell,
    PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, AlertCircle, Shield, Globe,
    Activity, Zap, Loader2, RefreshCw,
    Cpu, Radio, Fingerprint, Layers, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const AnalyticsPage = () => {
    const [metrics, setMetrics] = useState({
        avg_risk: 0,
        active_anomalies: 0,
        sync_confidence: 0,
        nodes_monitored: 0,
        risk_velocity: [],
        sector_distribution: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');

    const fetchGlobalMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/risk`);
            setMetrics(res.data);
        } catch (err) {
            console.error("Failed to fetch global analytics:", err);
            setError("STRATUM Uplink Interrupted");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalMetrics();
        const interval = setInterval(fetchGlobalMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !metrics.risk_velocity.length) return (
        <div className="h-full w-full flex items-center justify-center bg-stratum-dark">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-stratum-accent animate-spin" />
                    <Shield className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.4em] animate-pulse">Establishing CORTEX Uplink</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-8 min-h-full max-w-[1600px] mx-auto">
            {/* ── Header Section ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="px-3 py-1 bg-stratum-accent/10 border border-stratum-accent/30 rounded-full">
                            <span className="text-[9px] font-black text-stratum-accent uppercase tracking-widest leading-none">Global Tier-1 Feed</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                            <Radio className="w-3 h-3" />
                            <span>324 Satellite Uplinks Active</span>
                        </div>
                    </div>
                    <h2 className="text-sm font-black text-white tracking-widest uppercase leading-none">Planetary Stress Intelligence</h2>
                    <p className="text-[10px] text-white/40 mt-1 max-w-xl font-medium leading-relaxed">Cross-referenced geospatial telemetry from ESA, NASA, and USGS processed via STRATUM CORTEX for infrastructure resilience.</p>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchGlobalMetrics}
                        className="glass-panel p-4 rounded-2xl text-white/30 hover:text-stratum-accent transition-all border border-white/5 hover:border-stratum-accent/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="glass-panel px-6 py-4 rounded-[2rem] flex items-center space-x-4 border-white/5 shadow-2xl">
                        <div className="text-right">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Neural Sync</p>
                            <p className={`text-xs font-black uppercase ${error ? 'text-risk-high' : 'text-stratum-accent'}`}>
                                {error ? 'Interrupted' : 'Active'}
                            </p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${error ? 'bg-risk-high/10' : 'bg-stratum-accent/10'}`}>
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${error ? 'bg-risk-high' : 'bg-stratum-accent'}`} />
                            <Fingerprint className={`w-5 h-5 ${error ? 'text-risk-high' : 'text-stratum-accent'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Metrics Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard label="Mean Risk Index" value={metrics.avg_risk} delta={metrics.avg_risk > 50 ? "+2.4%" : "-1.2%"} icon={Zap} type="primary" />
                <MetricCard label="Active Anomalies" value={metrics.active_anomalies} delta="LIVE" icon={AlertCircle} type="danger" />
                <MetricCard label="Model Reliability" value={`${metrics.sync_confidence}%`} delta="99.9%" icon={Shield} type="success" />
                <MetricCard label="Persistent Nodes" value={metrics.nodes_monitored.toLocaleString()} delta="CELL-7" icon={Globe} type="neutral" />
            </div>

            {/* ── Main Intel Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Global Velocity */}
                <div className="xl:col-span-2 glass-panel p-10 rounded-[3rem] border-white/5 h-[36rem] flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-[3s]">
                        <Globe className="w-64 h-64 text-stratum-accent" />
                    </div>

                    <div className="flex items-center justify-between mb-10 z-10 relative">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">Atmospheric Risk Velocity</h3>
                            <div className="flex items-center space-x-3 text-[8px] text-white/30 font-black uppercase tracking-widest">
                                <span className="text-stratum-accent flex items-center"><ChevronRight className="w-2 h-2" /> Real-time Feed</span>
                                <span>•</span>
                                <span>Multi-spectral Analysis</span>
                            </div>
                        </div>
                        <TrendingUp className="text-stratum-accent w-7 h-7" />
                    </div>

                    <div className="flex-1 z-10 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.risk_velocity}>
                                <defs>
                                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[#0a0a0b] border border-white/10 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                                                    <p className="text-[10px] font-black text-stratum-accent uppercase tracking-widest leading-none">
                                                        Risk: {payload[0].value.toFixed(1)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    cursor={{ stroke: 'rgba(0,242,255,0.2)', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#00f2ff"
                                    fill="url(#riskGrad)"
                                    strokeWidth={4}
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Sector Heat & Hotspots */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[3rem] border-white/5 h-[16rem] flex flex-col group">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Sector Density</h3>
                            <Layers className="w-4 h-4 text-white/10" />
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.sector_distribution} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="sector" type="category" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} width={60} />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[#0a0a0b] border border-white/10 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p>
                                                        <p className="text-[10px] font-black text-risk-high uppercase tracking-widest leading-none">
                                                            Count: {payload[0].value}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar dataKey="count" fill="#ff3d00" radius={[0, 10, 10, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[3rem] border-white/5 flex flex-col flex-1 min-h-[16rem]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Hotspots</h3>
                            <AlertCircle className="w-4 h-4 text-risk-high" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { id: 'SEC-7B-92', risk: '92.4%', status: 'CRITICAL', loc: 'Western Ridge' },
                                { id: 'SEC-4A-84', risk: '84.1%', status: 'URGENT', loc: 'Sub-surface' },
                                { id: 'SEC-12F-71', risk: '71.0%', status: 'WARNING', loc: 'Primary Grid' },
                            ].map((spot, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-[1.5rem] border border-white/5 group hover:border-risk-high/40 transition-all cursor-crosshair">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-2 h-2 bg-risk-high rounded-full animate-ping" />
                                        <div>
                                            <p className="text-[11px] font-black text-white leading-none mb-1">{spot.id}</p>
                                            <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{spot.loc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-risk-high">{spot.risk}</p>
                                        <p className="text-[7px] text-risk-high opacity-50 font-black uppercase">{spot.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-6 text-center">
                            <span className="text-[8px] font-black text-white/10 uppercase tracking-widest italic">:: Real-time Causal Correlation Active ::</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer Stats Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch pt-4">
                <div className="glass-panel p-10 rounded-[3.5rem] flex items-center justify-between group cursor-pointer hover:border-stratum-accent/30 transition-all shadow-xl bg-white/[0.02]">
                    <div className="flex items-center space-x-8">
                        <div className="w-20 h-20 bg-stratum-accent/10 rounded-[2rem] flex items-center justify-center text-stratum-accent group-hover:scale-110 transition-all duration-700 shadow-[inset_0_0_20px_rgba(0,242,255,0.1)]">
                            <Activity className="w-10 h-10 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-0.5">Global Stress Audit</h4>
                            <p className="text-[9px] text-white/40 max-w-[200px]">Planetary infrastructure scan completed across {metrics.nodes_monitored} persistent monitoring nodes.</p>
                        </div>
                    </div>
                    <div className="hidden sm:block h-3 w-40 bg-white/5 rounded-full overflow-hidden p-0.5">
                        <div className="h-full w-full bg-white/[0.02] rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="h-full bg-gradient-to-r from-stratum-accent to-[#0088ff] rounded-full"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel py-5 px-8 rounded-2xl bg-stratum-accent text-black flex items-center justify-center space-x-4 hover:bg-white transition-all transform group shadow-[0_10px_30px_rgba(0,242,255,0.15)]"
                >
                    <Shield className="w-4 h-4" />
                    <div className="text-left">
                        <span className="text-xs font-black uppercase tracking-widest block leading-none mb-1">Generate Audit</span>
                        <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">S-14 Protocol</span>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, delta, icon: Icon, type }) => {
    const colors = {
        primary: 'text-stratum-accent bg-stratum-accent/5 border-stratum-accent/20',
        danger: 'text-risk-high bg-risk-high/5 border-risk-high/20',
        success: 'text-risk-low bg-risk-low/5 border-risk-low/20',
        neutral: 'text-white bg-white/5 border-white/10'
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className={`glass-panel p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative group ${colors[type]}`}
        >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                <Icon className="w-16 h-16" />
            </div>
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="p-4 rounded-3xl bg-white/5 shadow-xl">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Delta Stream</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${delta.includes('+') || delta === 'LIVE' ? 'bg-risk-high/10 text-risk-high' : 'bg-risk-low/10 text-risk-low'}`}>
                        {delta}
                    </span>
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-lg font-black text-white mb-0.5 tracking-tighter">{value}</h3>
                <p className="text-[7px] text-white/30 font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
        </motion.div>
    );
};

export default AnalyticsPage;
