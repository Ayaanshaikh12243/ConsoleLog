import React, { useState, useEffect } from 'react';
import { Upload, Shield, Loader2, FileText, CheckCircle2, AlertTriangle, Clock, Cpu, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const RISK_COLOR = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('critical') || t.includes('immediate') || t.includes('failure')) return 'text-risk-high border-risk-high/30 bg-risk-high/5';
  if (t.includes('warning') || t.includes('elevated') || t.includes('moderate')) return 'text-risk-medium border-risk-medium/30 bg-risk-medium/5';
  return 'text-stratum-accent border-stratum-accent/30 bg-stratum-accent/5';
};

const UploadsPage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load upload history from MongoDB on mount
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/uploads/history`);
      setHistory(res.data || []);
    } catch (e) {
      console.error('History fetch failed:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Fake progress animation while waiting for LLM
    const progressInterval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 85) { clearInterval(progressInterval); return 85; }
        return p + Math.random() * 12;
      });
    }, 400);

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setResult(res.data);
        setUploadProgress(0);
        setUploading(false);
        fetchHistory(); // refresh history from MongoDB
      }, 600);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Upload failed:', err);
      setError('Neural link timeout. Backend or LLM unreachable. Try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-8 lg:p-12 min-h-full space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
          Field Intelligence Ingestion
        </h1>
        <p className="text-[11px] text-white/40 font-medium tracking-wide">
          Upload field reports, sensor exports, or multi-spectral datasets — CORTEX analyzes in real-time.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* ── LEFT: Upload Zone ── */}
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (!uploading) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={`relative rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 group overflow-hidden min-h-[22rem] ${
              dragActive
                ? 'border-stratum-accent bg-stratum-accent/5 ring-4 ring-stratum-accent/10'
                : uploading
                ? 'border-stratum-accent/50 bg-stratum-accent/3'
                : result
                ? 'border-risk-low/50 bg-risk-low/5'
                : 'border-white/10 bg-white/3 hover:border-white/20'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-stratum-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <motion.div
              animate={uploading ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`p-6 rounded-full mb-6 transition-all ${
                uploading ? 'bg-stratum-accent/20 text-stratum-accent' :
                result ? 'bg-risk-low/20 text-risk-low' :
                dragActive ? 'bg-stratum-accent/10 text-stratum-accent' :
                'bg-white/5 text-white/20 group-hover:text-stratum-accent group-hover:bg-stratum-accent/10'
              }`}
            >
              {result ? <CheckCircle2 className="w-12 h-12" /> :
               uploading ? <Loader2 className="w-12 h-12 animate-spin" /> :
               <Upload className="w-12 h-12" />}
            </motion.div>

            {/* Status text */}
            <div className="text-center relative z-10 mb-6">
              <h3 className="text-base font-black text-white mb-1 uppercase tracking-tight">
                {uploading ? 'CORTEX Analyzing...' :
                 result ? 'Analysis Complete' :
                 dragActive ? 'Release to Ingest' :
                 'Drop Intelligence Brief'}
              </h3>
              {selectedFile && (
                <p className="text-[11px] text-stratum-accent font-bold mb-1">{selectedFile.name}</p>
              )}
              {!uploading && !result && (
                <p className="text-white/30 text-xs max-w-xs mx-auto leading-relaxed">
                  .txt, .pdf, .csv, .json — Featherless Llama-3-70B analyzes your data in real-time
                </p>
              )}
            </div>

            {/* Upload progress bar */}
            <AnimatePresence>
              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-xs space-y-2"
                >
                  <div className="flex justify-between text-[10px] font-black text-stratum-accent uppercase tracking-widest">
                    <span>Ingesting neural data...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      style={{ width: `${uploadProgress}%` }}
                      className="h-full bg-stratum-accent rounded-full transition-all duration-300"
                    />
                  </div>
                  <p className="text-[9px] text-white/30 text-center">
                    Featherless Llama-3-70B processing field report...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Browse button */}
            {!uploading && !result && (
              <label className="mt-4 px-8 py-3 bg-stratum-accent text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl cursor-pointer hover:bg-white transition-colors relative z-10 shadow-[0_0_20px_rgba(0,242,255,0.3)]">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
              </label>
            )}

            {/* New upload button */}
            {result && !uploading && (
              <button
                onClick={() => { setResult(null); setSelectedFile(null); setError(null); }}
                className="mt-4 px-6 py-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
              >
                New Upload
              </button>
            )}
          </div>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-risk-high/10 border border-risk-high/30 flex items-start space-x-3"
              >
                <AlertTriangle className="w-5 h-5 text-risk-high mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-risk-high uppercase tracking-wide mb-1">Upload Failed</p>
                  <p className="text-[11px] text-white/60">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Panel */}
          <div className="glass-panel p-5 rounded-2xl flex items-start space-x-4 border border-white/5">
            <div className="p-3 rounded-xl bg-stratum-accent/10 text-stratum-accent shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">PROBE Security Protocol</h4>
              <p className="text-[10px] text-white/35 leading-relaxed">
                All uploaded binary data is scrubbed for metadata prior to analysis. STRATUM does not store raw field artifacts permanently — only AI-generated intelligence summaries are persisted to MongoDB.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Result + History ── */}
        <div className="space-y-6">
          {/* Current Result */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass-panel p-8 rounded-3xl border relative overflow-hidden ${RISK_COLOR(result.analysis)}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CheckCircle2 className="w-28 h-28" />
                </div>

                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-stratum-accent animate-ping" />
                  <span className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.3em]">
                    CORTEX-X1 — ANALYSIS COMPLETE
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Cpu className="w-4 h-4 text-stratum-accent" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{result.filename}</span>
                  <span className="text-[9px] text-white/20">• {result.file_size}</span>
                </div>

                <p className="text-[14px] text-white leading-relaxed font-medium mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                  "{result.analysis}"
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Risk Trajectory</p>
                    <p className="text-sm font-black text-white">{result.prediction}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Analyzed At</p>
                    <p className="text-sm font-black text-white">
                      {new Date(result.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : !loadingHistory && history.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-48 flex flex-col items-center justify-center border-2 border-white/5 rounded-3xl bg-white/2"
              >
                <FileText className="w-10 h-10 text-white/5 mb-4" />
                <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">
                  No uploads yet — drop a file to begin
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ── Upload History from MongoDB ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                Upload History — MongoDB
              </h3>
              <button
                onClick={fetchHistory}
                className="p-1.5 rounded-lg text-white/20 hover:text-stratum-accent transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((item, i) => (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-xl bg-stratum-accent/10 text-stratum-accent shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.filename}</p>
                          <p className="text-[10px] text-white/40 leading-relaxed mt-1 line-clamp-2">
                            {item.analysis}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 pl-11">
                      <Clock className="w-3 h-3 text-white/15" />
                      <span className="text-[9px] text-white/20">
                        {new Date(item.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/15 uppercase tracking-widest text-center py-8">
                No past uploads in database
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadsPage;
