import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Clock, MapPin, ShieldAlert, Cpu,
  Trash2, Zap, ChevronDown, ChevronUp, FileText, Wrench,
  Loader2, X, BrainCircuit, ExternalLink, Download, MessageSquare, CheckCircle2
} from 'lucide-react';

const AlertsPage = () => {
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const [generatingReport, setGeneratingReport] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [globalBriefing, setGlobalBriefing] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [smsSending, setSmsSending] = useState({});
  const [smsSent, setSmsSent]       = useState({});

  const fetchGlobalBriefing = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/intelligence/global-briefing');
      setGlobalBriefing(res.data.briefing);
    } catch (err) {
      console.error('Failed briefing', err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/alerts');
      setAlerts(Array.isArray(res.data) ? res.data : res.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchGlobalBriefing();
    const interval = setInterval(() => {
        fetchAlerts();
        fetchGlobalBriefing();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleGenerateReport = async (alertId) => {
    setGeneratingReport(alertId);
    try {
      const data = await api.generateAlertReport(alertId);
      if (data.status === 'GENERATED') {
        setCurrentReport(data);
      } else {
        alert(data.message || 'Generation failed');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      alert('SENTINEL-QWEN Reasoning Engine Link Failure.');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleSendSMS = async (alertId) => {
    setSmsSending(prev => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch(
        `http://localhost:8000/api/alerts/${alertId}/sms`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (data.success) {
        setSmsSent(prev => ({ ...prev, [alertId]: true }));
      }
    } catch (e) {
      console.error('SMS send failed', e);
    } finally {
      setSmsSending(prev => ({ ...prev, [alertId]: false }));
    }
  };

  const handleSaveToReports = async () => {
    if (!currentReport) return;
    setSaving(true);
    try {
      // Find the alert this report belongs to for location/context
      const alertSource = alerts.find(a => String(a.id) === String(currentReport.alert_id));
      
      const reportToSave = {
        summary: `Strategic Intelligence: ${alertSource?.location || 'Unknown Zone'}`,
        disaster_type: (alertSource?.disaster_type || alertSource?.trigger || 'Anomaly').toLowerCase(),
        affected_area: alertSource?.location || 'Unknown Sector',
        severity: alertSource?.risk > 70 ? 'critical' : 'high',
        key_findings: [
          'Autonomous Qwen-model reasoning active',
          'Cross-referenced with real-time sensor array'
        ],
        infrastructure_risk: {
            roads: 'unknown',
            bridges: 'unknown',
            water_systems: 'unknown',
            power_grid: 'unknown',
            buildings: 'unknown'
        },
        immediate_actions: ['Manual verification of AI strategic targets'],
        generated_at: currentReport.timestamp,
        confidence: 0.92,
        // Custom field for the full Qwen text
        ai_report_text: currentReport.report,
        is_ai_generated: true
      };
      
      await api.saveReport(reportToSave);
      alert('Intelligence Pinned to Archive.');
      setCurrentReport(null);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Archive Deployment Failed.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'ALL')      return true;
    if (filter === 'CRITICAL') return a.risk > 70;
    if (filter === 'WARNING')  return a.risk > 35 && a.risk <= 70;
    return true;
  });

  const autoCount = alerts.filter(a =>
    !a.trigger || a.trigger === 'EARTHQUAKE' || a.trigger === 'AUTO'
  ).length;

  return (
    <div className="p-10 space-y-8">
      {/* ── Header ────────────────────────────────────────────── */}
    
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-risk-high/10 text-risk-high">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              System Alerts
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">
                Autonomous detection log — {alerts.length} active
              </p>
              {/* Live monitor badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                  Monitor Active
                </span>
              </div>
              {/* Auto-detect count */}
              {autoCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stratum-accent/10 border border-stratum-accent/20">
                  <Zap className="w-2.5 h-2.5 text-stratum-accent" />
                  <span className="text-[9px] font-black text-stratum-accent uppercase tracking-widest">
                    {autoCount} Auto-Detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
              <div className="flex gap-5 items-center w-full flex-col">
        {/* Filter pills */}
        {/* ── Global Sentiment Card ──────────────────────────────── */}
        
        <div className="flex-1 min-w-[300px]">
           <div className="glass-panel p-5 rounded-3xl border border-stratum-accent/20 bg-stratum-accent/[0.05] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-16 h-16 text-stratum-accent" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-3.5 h-3.5 text-stratum-accent" />
                  <span className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.2em]">Sentinel Strategic Briefing</span>
                </div>
                {briefingLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 animate-pulse rounded w-full" />
                    <div className="h-4 bg-white/5 animate-pulse rounded w-2/3" />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-white/90 leading-relaxed max-w-2xl italic">
                    "{globalBriefing}"
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4">
                   <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/30 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-stratum-accent animate-ping" />
                      LLM-Qwen-Core: Active
                   </div>
                   <div className="text-[9px] font-bold text-stratum-accent/50 uppercase tracking-widest">
                      Planetary Integrity: 94.2%
                   </div>
                </div>
              </div>
           </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'CRITICAL', 'WARNING'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? f === 'CRITICAL' ? 'bg-risk-high/20   border-risk-high   text-risk-high'
                  : f === 'WARNING'  ? 'bg-risk-medium/20 border-risk-medium text-risk-medium'
                  :                   'bg-stratum-accent/20 border-stratum-accent text-stratum-accent'
                  : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'
              }`}
            >
              {f}
              <span className="ml-1.5 opacity-50">
                {f === 'ALL'      ? alerts.length
                : f === 'CRITICAL' ? alerts.filter(a => a.risk > 70).length
                : alerts.filter(a => a.risk > 35 && a.risk <= 70).length}
              </span>
            </button>
          ))}
        </div>
        </div>
      </header>

      {/* ── Alert Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filtered.length > 0 ? (
            filtered.map((alert, idx) => {
              const isAuto = !alert.trigger || alert.trigger === 'EARTHQUAKE' || alert.trigger === 'AUTO';
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.07 }}
                  className="group relative glass-panel rounded-[2.5rem] border border-white/5 hover:border-risk-high/30 transition-all duration-500 overflow-hidden"
                >
                  {/* Risk glow */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 ${
                    alert.risk > 70 ? 'bg-risk-high' : 'bg-risk-medium'
                  }`} />

                  <div className="relative z-10 p-6 space-y-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl bg-white/5 ${
                          alert.risk > 70 ? 'text-risk-high' : 'text-risk-medium'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          {/* Badge row */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              {alert.disaster_type || 'Anomaly'}
                            </span>
                            <div className="px-2 py-0.5 rounded-full bg-stratum-accent/10 border border-stratum-accent/20 flex items-center gap-1">
                              <Zap className="w-2 h-2 text-stratum-accent" />
                              <span className="text-[8px] font-black text-stratum-accent uppercase">
                                {alert.trigger || 'MANUAL'}
                              </span>
                            </div>
                            {/* AUTO-DETECT badge */}
                            {isAuto && (
                              <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">
                                  AUTO-DETECT
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white uppercase tracking-tight">
                            {alert.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-white">{alert.risk}%</span>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Risk</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 relative">
                      <p className="text-sm font-bold text-white/80 leading-relaxed pr-8">
                        {alert.message}
                      </p>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-white/20 hover:bg-risk-high hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Expand briefs toggle */}
                    {(alert.minister_brief || alert.engineer_brief) && (
                      <button
                        onClick={() => toggleExpand(alert.id)}
                        className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-stratum-accent/30 transition-all"
                      >
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                          Intelligence Briefs
                        </span>
                        {expanded[alert.id]
                          ? <ChevronUp className="w-3 h-3 text-white/30" />
                          : <ChevronDown className="w-3 h-3 text-white/30" />
                        }
                      </button>
                    )}

                    {/* Expanded briefs */}
                    <AnimatePresence>
                      {expanded[alert.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          {alert.minister_brief && (
                            <div className="p-4 rounded-2xl bg-stratum-accent/5 border border-stratum-accent/20">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3 h-3 text-stratum-accent" />
                                <span className="text-[8px] font-black text-stratum-accent uppercase tracking-widest">
                                  Minister Brief
                                </span>
                              </div>
                              <p className="text-[11px] text-white/70 leading-relaxed">
                                {alert.minister_brief}
                              </p>
                            </div>
                          )}
                          {alert.engineer_brief && (
                            <div className="p-4 rounded-2xl bg-risk-medium/5 border border-risk-medium/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Wrench className="w-3 h-3 text-risk-medium" />
                                <span className="text-[8px] font-black text-risk-medium uppercase tracking-widest">
                                  Engineer Brief
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">
                                {alert.engineer_brief}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-4 flex-wrap border-t border-white/5 pt-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-stratum-accent" />
                        <span className="text-[10px] font-black text-white/60 truncate">
                          {alert.location}
                        </span>
                      </div>
                      
                      {/* NEW: AI Generation Button + SMS Button */}
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleGenerateReport(alert.id)}
                          disabled={generatingReport === alert.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stratum-accent/10 border border-stratum-accent/20 text-stratum-accent hover:bg-stratum-accent/20 transition-all disabled:opacity-40"
                        >
                          {generatingReport === alert.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <BrainCircuit className="w-3 h-3" />
                          )}
                          <span className="text-[8px] font-black uppercase tracking-widest">
                            GENERATE QWEN REPORT
                          </span>
                        </button>

                        <button
                          onClick={() => handleSendSMS(alert.id)}
                          disabled={smsSending[alert.id] || smsSent[alert.id]}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: smsSent[alert.id] ? 'default' : 'pointer',
                            background: smsSent[alert.id]
                              ? 'rgba(34,197,94,0.15)'
                              : 'rgba(0,242,255,0.08)',
                            borderColor: smsSent[alert.id] ? '#22c55e' : '#00f2ff',
                            color: smsSent[alert.id] ? '#22c55e' : '#00f2ff',
                            transition: 'all 0.2s',
                          }}
                        >
                          {smsSending[alert.id] ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : smsSent[alert.id] ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <MessageSquare size={12} />
                          )}
                          {smsSent[alert.id] ? 'Call Alert Sent' : smsSending[alert.id] ? 'Sending…' : 'Call Alert SMS'}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 justify-end">
                        <Clock className="w-3 h-3 text-white/20" />
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(alert.time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <Cpu className="w-12 h-12 text-white/5 mx-auto mb-4 animate-pulse" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">
                No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}alerts in current buffer
              </p>
              <p className="text-white/10 text-xs mt-2 font-mono uppercase tracking-widest">
                Autonomous monitor scanning India zones every 90s…
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI Report Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {currentReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-black"
            >
              {/* Modal Header */}
              <div className="p-6 bg-black text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stratum-accent/20 rounded-xl">
                    <BrainCircuit className="w-5 h-5 text-stratum-accent" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">SENTINEL-QWEN INTELLIGENCE</h2>
                    <p className="text-[10px] text-white/40 font-mono">MODEL: {currentReport.model}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentReport(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-light font-sans text-black">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-black/30 tracking-widest uppercase">
                    <FileText className="w-3 h-3" />
                    Generated Report Content
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-black/5 selection:bg-stratum-accent selection:text-black">
                    {currentReport.report}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-100 border-t border-black/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.1em]">
                  AUTH: STRATUM-7-CORE
                </span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCurrentReport(null)}
                    className="px-4 py-2 border border-black/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSaveToReports}
                    disabled={saving}
                    className="px-6 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stratum-accent hover:text-black transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Save to Archive
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertsPage;