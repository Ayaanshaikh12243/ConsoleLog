import React, { useState, useEffect } from 'react';
import {
  X, Droplets, Thermometer, ShieldAlert, Loader2,
  Activity, Cpu, RotateCcw, Fingerprint, MapPin,
  Radio, Layers, TrendingUp, FileText, Wrench, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

const API_BASE_URL = 'http://localhost:8000/api';

// ── Forecast chart data from ORACLE output ─────────────────────────────────
const buildForecastData = (pipeline) => {
  if (!pipeline) return [];
  return [
    { label: 'Now',  risk: Math.round((pipeline.forecast_30d  || 0) * 50) },
    { label: '30d',  risk: Math.round((pipeline.forecast_30d  || 0) * 100) },
    { label: '90d',  risk: Math.round((pipeline.forecast_90d  || 0) * 100) },
    { label: '180d', risk: Math.round((pipeline.forecast_180d || 0) * 100) },
  ];
};

const Dashboard = ({ onClose }) => {
  const { cellData, loading: storeLoading } = useStore();
  const cell = cellData;
  const [activeTab, setActiveTab] = useState('overview'); // overview | briefs
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const pipeline = cell?.agent_pipeline;
  const forecastData = buildForecastData(pipeline);
  const seismic = cell?.seismic;
  const nasa = cell?.nasa;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/report/${cell.node_id}/pdf`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `STRATUM-Report-${cell.node_id.substring(0,8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error("Download error:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (!cell || storeLoading) {
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed top-20 right-6 bottom-12 w-[26rem] glass-panel z-50 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-10 text-center shadow-2xl"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl border-2 border-stratum-accent/20 animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-stratum-accent animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-2">Synchronizing Node</h3>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">STRATUM pipeline initializing...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed top-20 right-6 bottom-12 w-[26rem] glass-panel z-50 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              cell.risk > 80 ? 'bg-risk-high' : cell.risk > 50 ? 'bg-risk-medium' : 'bg-risk-low'
            }`} />
            <h2 className="text-base font-bold text-white uppercase tracking-tight">
              {cell.location || cell.node_id}
            </h2>
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">
            {cell.node_id?.substring(0, 15)}…
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all group">
          <X className="w-5 h-5 text-white/40 group-hover:text-white" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-white/10 bg-white/[0.02]">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'briefs',   label: 'Briefs',   icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'text-stratum-accent border-b-2 border-stratum-accent'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {activeTab === 'overview' && (
          <>
            {/* Risk Score Hero */}
            <div className={`relative p-5 rounded-2xl border overflow-hidden ${
              cell.risk > 80 ? 'bg-risk-high/10 border-risk-high/30' :
              cell.risk > 50 ? 'bg-risk-medium/10 border-risk-medium/30' :
              'bg-risk-low/10 border-risk-low/30'
            }`}>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    cell.risk > 80 ? 'bg-risk-high/20 text-risk-high' : 'bg-risk-low/20 text-risk-low'
                  }`}>
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">{cell.status}</h2>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-stratum-accent" />
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                        {cell.location || cell.hex || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">{cell.risk}%</p>
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Risk Index</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cell.risk}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full ${
                    cell.risk > 70 ? 'bg-risk-high' :
                    cell.risk > 35 ? 'bg-risk-medium' : 'bg-risk-low'
                  }`}
                />
              </div>
            </div>

            {/* Telemetry Grid — now 6 metrics including seismic */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rainfall',   value: `${nasa?.rainfall ?? '—'} mm/d`,      icon: Droplets,     color: 'text-stratum-accent' },
                { label: 'Temp',       value: `${nasa?.temp ?? '—'}°C`,              icon: Thermometer,  color: 'text-risk-medium'    },
                { label: 'Humidity',   value: `${nasa?.humidity ?? '—'}%`,           icon: Activity,     color: 'text-risk-low'       },
                { label: 'Seismic Mag',value: seismic?.mag ? `M${seismic.mag}` : '—', icon: Radio,       color: 'text-risk-high'      },
                { label: 'Depth',      value: seismic?.depth_km ? `${seismic.depth_km} km` : '—', icon: Layers, color: 'text-white/50' },
                { label: 'VERITAS',    value: pipeline?.confidence ? `${pipeline.confidence}%` : '—', icon: Cpu, color: 'text-stratum-accent' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <m.icon className={`w-3 h-3 ${m.color}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                  </div>
                  <p className="text-sm font-bold text-white uppercase">{m.value}</p>
                </div>
              ))}
            </div>

            {/* ORACLE Forecast Chart — 30d / 90d / 180d */}
            {forecastData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-stratum-accent" />
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                      ORACLE Forecast
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/5 font-mono text-[9px] text-white/40">
                    <RotateCcw className="w-3 h-3 animate-spin-slow" />
                    <span>10,000 SCENARIOS</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00f2ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(v) => [`${v}%`, 'Risk']}
                      />
                      <ReferenceLine y={70} stroke="#ff3d00" strokeDasharray="3 3" strokeOpacity={0.4} />
                      <ReferenceLine y={35} stroke="#ffcc00" strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Area type="monotone" dataKey="risk" stroke="#00f2ff" strokeWidth={2} fill="url(#riskGrad)" dot={{ fill: '#00f2ff', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Forecast numbers below chart */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                    {[
                      { label: '30-Day',  value: pipeline?.forecast_30d  },
                      { label: '90-Day',  value: pipeline?.forecast_90d  },
                      { label: '180-Day', value: pipeline?.forecast_180d },
                    ].map((f, i) => (
                      <div key={i} className="text-center">
                        <p className={`text-sm font-black ${
                          (f.value * 100) > 70 ? 'text-risk-high' :
                          (f.value * 100) > 35 ? 'text-risk-medium' : 'text-risk-low'
                        }`}>
                          {f.value != null ? `${Math.round(f.value * 100)}%` : '—'}
                        </p>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost of inaction */}
                {pipeline?.cost_crores > 0 && (
                  <div className="p-4 rounded-2xl bg-risk-high/5 border border-risk-high/20 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Cost if Unaddressed</p>
                      <p className="text-lg font-black text-risk-high">₹{pipeline.cost_crores} Cr</p>
                    </div>
                    <ShieldAlert className="w-8 h-8 text-risk-high/30" />
                  </div>
                )}
              </div>
            )}

            {/* Causal Synthesis */}
            <div className="p-5 rounded-[2rem] bg-stratum-accent/[0.03] border border-stratum-accent/10">
              <div className="flex items-center gap-2 mb-3 opacity-40">
                <Fingerprint className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white">Causal Synthesis</span>
              </div>
              <p className="text-[12px] font-bold text-white/70 leading-relaxed">
                {cell.cause || 'No anomalies detected in current observation window.'}
              </p>
            </div>
          </>
        )}

        {activeTab === 'briefs' && (
          <div className="space-y-5">
            {/* Minister Brief */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stratum-accent/10">
                  <FileText className="w-3 h-3 text-stratum-accent" />
                </div>
                <span className="text-[9px] font-black text-stratum-accent uppercase tracking-widest">
                  Minister Brief
                </span>
                <span className="ml-auto text-[8px] text-white/20 font-mono">SCRIBE v2</span>
              </div>
              <p className="text-[12px] text-white/80 leading-relaxed font-medium">
                {pipeline?.minister_brief || cell.alert?.minister_brief || 'No brief generated yet. Trigger an alert to generate minister-level summary.'}
              </p>
            </div>

            {/* Engineer Brief */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-risk-medium/10">
                  <Wrench className="w-3 h-3 text-risk-medium" />
                </div>
                <span className="text-[9px] font-black text-risk-medium uppercase tracking-widest">
                  Engineer Brief
                </span>
                <span className="ml-auto text-[8px] text-white/20 font-mono">STRATUM PROBE</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed font-mono whitespace-pre-wrap">
                {pipeline?.engineer_brief || cell.alert?.engineer_brief || 'No technical brief generated.'}
              </p>
            </div>

            {/* Seismic Event Detail */}
            {seismic?.place && (
              <div className="p-5 rounded-2xl bg-risk-high/5 border border-risk-high/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-3 h-3 text-risk-high" />
                  <span className="text-[9px] font-black text-risk-high uppercase tracking-widest">Seismic Event</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Magnitude</p>
                    <p className="text-lg font-black text-white">M{seismic.mag}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Depth</p>
                    <p className="text-lg font-black text-white">{seismic.depth_km} km</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-[11px] font-bold text-white/80">{seismic.place}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-[11px] font-mono text-white/60">
                      {seismic.time ? new Date(seismic.time).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stratum-accent/10 border border-stratum-accent/20 hover:bg-stratum-accent/20 transition-all text-stratum-accent font-black text-[10px] uppercase tracking-widest"
      >
        {downloading
          ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating Report...</>
          : <><Download className="w-3 h-3" /> Download PDF Report</>
        }
      </button>
    </motion.div>
  );
};

export default Dashboard;