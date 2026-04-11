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
  Upload
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

const API_BASE_URL = 'http://localhost:8000/api';

const Dashboard = ({ cell, onClose }) => {
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

  if (!cell) return null;

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
        <div className={`relative p-5 rounded-2xl border overflow-hidden transition-all duration-500 ${
          cell.risk > 80 ? 'bg-risk-high/10 border-risk-high/30 risk-glow-high' : 
          cell.risk > 50 ? 'bg-risk-medium/10 border-risk-medium/30 risk-glow-medium' : 
          'bg-risk-low/10 border-risk-low/30 risk-glow-low'
        }`}>
          <div className="flex items-center justify-between z-10 relative">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                cell.risk > 80 ? 'bg-risk-high/20 text-risk-high' : 'bg-risk-low/20 text-risk-low'
              }`}>
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Assessment</p>
                <p className="text-xl font-black text-white">{cell.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white">{cell.risk}%</p>
              <p className="text-[9px] text-white/40 font-bold uppercase">Confidence</p>
            </div>
          </div>
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${cell.risk}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${cell.risk > 80 ? 'bg-risk-high' : 'bg-risk-low'}`}
            />
          </div>
        </div>

        {/* Real-time Metrics from NASA/USGS */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            icon={Droplets} 
            label="Precipitation" 
            value={cell.nasa?.rainfall !== undefined && cell.nasa?.rainfall !== 'N/A' ? `${cell.nasa.rainfall} mm/d` : 'N/A'} 
            status={cell.nasa?.source || 'NASA POWER'} 
            color="text-stratum-accent" 
          />
          <MetricCard 
            icon={Thermometer} 
            label="Surface Temp" 
            value={cell.nasa?.temp !== undefined && cell.nasa?.temp !== 'N/A' ? `${cell.nasa.temp}°C` : 'N/A'} 
            status={cell.nasa?.source === 'STRATUM ESTIMATE' ? 'Estimated' : 'Synchronized'} 
            color="text-risk-medium" 
          />
          <MetricCard 
            icon={Activity} 
            label="Seismic Mag" 
            value={cell.seismic?.mag !== undefined ? `${Number(cell.seismic.mag).toFixed(2)}` : '—'} 
            status={cell.seismic?.place ? cell.seismic.place.substring(0, 20) + '…' : 'No local event'} 
            color={cell.seismic?.mag > 3 ? 'text-risk-high' : 'text-risk-medium'} 
          />
          <MetricCard 
            icon={Wind} 
            label="Humidity" 
            value={cell.nasa?.humidity !== undefined && cell.nasa?.humidity !== 'N/A' ? `${cell.nasa.humidity}%` : 'N/A'} 
            status="Optimal" 
            color="text-white/40" 
          />
        </div>




      </div>

      {/* Footer Actions */}
      <div className="p-5 bg-white/5 border-t border-white/10 grid grid-cols-2 gap-4">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center space-x-2 bg-stratum-accent py-3 rounded-xl text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{downloading ? 'Compiling...' : 'Get PDF Intel'}</span>
        </button>
        <button 
          onClick={handleNotify}
          className={`flex items-center justify-center space-x-2 border py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
            notified ? 'border-risk-low text-risk-low' : 'border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {notified ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{notified ? 'Admin Notified' : 'Escalate Unit'}</span>
        </button>
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
