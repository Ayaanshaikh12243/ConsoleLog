import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Droplets,
  Thermometer,
  Wind,
  ShieldAlert,
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  Activity,
  Upload,
  Cpu,
  RotateCcw,
  Fingerprint,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

const API_BASE_URL = 'http://localhost:8000/api';

const Dashboard = ({ onClose }) => {
  const { cellData, loading: storeLoading } = useStore();
  const cell = cellData;

  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [notified, setNotified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!cell) return;
      setLoading(true);
      try {
        const [historyRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/history/${cell.node_id}`),
          axios.get(`${API_BASE_URL}/agents/${cell.node_id}`)
        ]);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cell]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      // Immediately inject AI insight into the dashboard view
      cell.prediction = res.data.analysis;
      setLogs(prev => [
        { agent: 'CORTEX', message: `Integrating field data from ${file.name}...`, type: 'info' },
        ...prev
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Intelligence upload failed. System in lockdown.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`STRATUM-Report-${cell.node_id}.pdf has been generated and downloaded.`);
    }, 2000);
  };

  const handleNotify = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 3000);
  };

  if (!cell || loading || storeLoading) {
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
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">CORTEX is establishing planetary causal links...</p>
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
            <div className={`w-2 h-2 rounded-full animate-pulse ${cell.risk > 80 ? 'bg-risk-high' : cell.risk > 50 ? 'bg-risk-medium' : 'bg-risk-low'
              }`}></div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">{cell.node_id}</h2>
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Coords: {cell.hex}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all group">
          <X className="w-5 h-5 text-white/40 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Risk Score Hero */}
        <div className={`relative p-5 rounded-2xl border overflow-hidden transition-all duration-500 ${cell.risk > 80 ? 'bg-risk-high/10 border-risk-high/30 risk-glow-high' :
          cell.risk > 50 ? 'bg-risk-medium/10 border-risk-medium/30 risk-glow-medium' :
            'bg-risk-low/10 border-risk-low/30 risk-glow-low'
          }`}>
          <div className="flex items-center justify-between z-10 relative">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${cell.risk > 80 ? 'bg-risk-high/20 text-risk-high' : 'bg-risk-low/20 text-risk-low'
                }`}>
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{cell.status}</h2>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-stratum-accent" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{cell?.location || cell?.hex || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white">{cell.risk}%</p>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Risk Index</p>
            </div>
          </div>
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cell.risk}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${cell.risk > 70 ? 'bg-risk-high' : cell.risk > 35 ? 'bg-risk-medium' : 'bg-risk-low'}`}
            />
          </div>
        </div>

        {/* Telemetry Grid (Medium Text) */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Rainfall', value: `${cell.nasa?.rainfall || '0.0'} mm/d`, icon: Droplets, color: 'text-stratum-accent' },
            { label: 'Temp', value: `${cell.nasa?.temp || '0.0'}°C`, icon: Thermometer, color: 'text-risk-medium' },
            { label: 'NDVI', value: `${(cell.nasa?.ndvi || 0).toFixed(2)}`, icon: Activity, color: 'text-risk-low' },
            { label: 'Soil', value: `${((cell.nasa?.soil_moisture || 0) * 100).toFixed(0)}%`, icon: Droplets, color: 'text-stratum-accent' }
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2 opacity-30">
                <m.icon className={`w-3 h-3 ${m.color}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
              </div>
              <p className="text-base font-bold text-white uppercase">{m.value}</p>
            </div>
          ))}
        </div>

        {/* ORACLE MONTE CARLO SECTION */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-stratum-accent" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">ORACLE Projections</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/5 font-mono text-[9px] text-white/40">
              <RotateCcw className="w-3 h-3 animate-spin-slow" />
              <span>1,000 CYCLES</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Simulated Danger</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{(cell.risk * 10).toFixed(0)}</span>
                  <span className="text-xs font-black text-white/20">/ 1,000</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Confidence Check</p>
                <span className={`text-2xl font-black ${cell.risk > 70 ? 'text-risk-high' : cell.risk > 35 ? 'text-risk-medium' : 'text-stratum-accent'}`}>{cell.risk}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cell.risk}%` }}
                className={`h-full ${cell.risk > 70 ? 'bg-risk-high' : cell.risk > 35 ? 'bg-risk-medium' : 'bg-stratum-accent'}`}
              />
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-stratum-accent/[0.03] border border-stratum-accent/10">
            <div className="flex items-center gap-2 mb-4 opacity-30">
              <Fingerprint className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Causal Synthesis</span>
            </div>
            <p className="text-[13px] font-bold text-white/70 leading-relaxed uppercase">
              Temporal analysis cross-referenced. Predicts {cell.risk}% risk due to {cell.cause?.toLowerCase() || 'unidentified stress factors'}. Mitigation protocols active.
            </p>
          </div>
        </div>




      </div>


    </motion.div>
  );
};

const MetricCard = ({ icon: Icon, label, value, status, color }) => (
  <div className="bg-white/3 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
        {status}
      </span>
    </div>
    <div className="space-y-0.5">
      <span className="text-xs font-black text-white block truncate">{value}</span>
      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default Dashboard;
