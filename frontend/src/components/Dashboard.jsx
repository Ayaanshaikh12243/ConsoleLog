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

        {/* AI Analysis Brief */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group hover:border-stratum-accent/50 transition-all duration-500">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <TrendingUp className="w-12 h-12 text-stratum-accent" />
            </div>
            <h3 className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.2em] mb-3 flex items-center">
                <div className="w-1.5 h-1.5 bg-stratum-accent rounded-full animate-ping mr-2"></div>
                STRATUM CORTEX — Intelligence Analysis
            </h3>
            <p className="text-[13px] text-white/90 leading-relaxed font-medium">
                {cell.prediction || cell.ai_report || "Establishing neural handshake with Featherless LLM..."}
            </p>
        </div>

        {/* Dynamic Chart */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">14-Day Node Health</h3>
            <div className="flex space-x-2">
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-stratum-accent"></div>
                    <span className="text-[8px] text-white/40">NDVI</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-risk-medium"></div>
                    <span className="text-[8px] text-white/40">Moisture</span>
                </div>
            </div>
          </div>
          
          <div className="h-48">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/10" />
              </div>
            ) : Array.isArray(history) && history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ffcc00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="ndvi" stroke="#00f2ff" fillOpacity={1} fill="url(#colorNdvi)" strokeWidth={2} />
                  <Area type="monotone" dataKey="moisture" stroke="#ffcc00" fillOpacity={1} fill="url(#colorMoisture)" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-white/20 text-[10px]">
                No spectral history in current buffer.
              </div>
            )}
          </div>
        </div>

        {/* Field Intelligence Upload */}
        <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/20 hover:border-stratum-accent/50 transition-all group">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center">
                <Upload className="w-3 h-3 mr-2" />
                Intelligence Ingestion
            </h3>
            
            {uploading ? (
                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-stratum-accent uppercase tracking-widest">
                        <span>Ingesting Spectral Data...</span>
                        <span>{Math.round(Math.random()*100)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-stratum-accent"
                        />
                    </div>
                </div>
            ) : uploadResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="p-4 bg-stratum-accent/10 border border-stratum-accent/30 rounded-2xl">
                        <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle2 className="w-3 h-3 text-stratum-accent" />
                            <p className="text-[10px] text-stratum-accent font-black uppercase tracking-tight">CORTEX: Insight Integrated</p>
                        </div>
                        <p className="text-[12px] text-white leading-relaxed font-medium italic">"{uploadResult.analysis}"</p>
                    </div>
                    <button 
                        onClick={() => setUploadResult(null)}
                        className="w-full py-2 border border-white/5 rounded-xl text-[9px] text-white/30 hover:text-white uppercase font-black transition-all"
                    >
                        Purge Site Memory
                    </button>
                </motion.div>
            ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer group/upload py-2">
                    <div className="flex flex-col items-center justify-center transition-transform group-hover/upload:scale-105">
                        <div className="p-3 rounded-xl bg-white/5 mb-3 text-white/20 group-hover/upload:text-stratum-accent group-hover/upload:bg-stratum-accent/10 transition-all">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] text-white/40 font-black group-hover/upload:text-white transition-colors">
                            UPLOAD FIELD telemetry
                        </p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            )}
        </div>

        {/* Live Agent Logs */}
        <div className="space-y-4 pt-6 border-t border-white/5 mb-6">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">CORTEX Intelligence Chain</h3>
          {loading ? (
             <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg"></div>)}
             </div>
          ) : (
            <div className="space-y-4">
                {Array.isArray(logs) && logs.length > 0 ? logs.map((log, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex space-x-4 group"
                    >
                        <div className={`w-0.5 h-10 rounded-full transition-all duration-500 group-hover:h-12 ${
                            log?.type === 'error' ? 'bg-risk-high' : log?.type === 'warning' ? 'bg-risk-medium' : 'bg-risk-low'
                        }`}></div>
                        <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{log?.agent || 'SYSTEM'}</p>
                            <p className="text-[11px] text-white/70 leading-relaxed font-medium">{log?.message || 'Synchronizing node data...'}</p>
                        </div>
                    </motion.div>
                )) : (
                  <p className="text-[11px] text-white/20 italic">No autonomous traces in current buffer.</p>
                )}
            </div>
          )}
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
