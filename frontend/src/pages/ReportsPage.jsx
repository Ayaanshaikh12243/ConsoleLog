import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Clock, 
  Search, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Zap,
  Shield,
  Loader2
} from 'lucide-react';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/reports');
      setReports(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!reportText && !selectedFile) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('report_text', reportText);
        response = await axios.post('http://localhost:5000/analyze-document', formData);
      } else {
        response = await axios.post('http://localhost:5000/analyze-report', { report_text: reportText });
      }
      setAnalysisResult(response.data);
    } catch (e) {
      console.error('Analysis failed:', e);
      alert('SENTINEL Analysis Failed: Could not connect to Gemini reasoning engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const severityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
    critical: 'text-purple-400'
  };

  const bgSeverity = {
    low: 'bg-green-400/10 border-green-400/20',
    medium: 'bg-yellow-400/10 border-yellow-400/20',
    high: 'bg-red-400/10 border-red-400/20',
    critical: 'bg-purple-400/10 border-purple-400/20'
  };

  return (
    <div className="p-4 lg:p-10 bg-stratum-dark min-h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-stratum-accent" />
              <span className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.3em]">Autonomous Intelligence</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">AIR ANALYZER</h1>
            <p className="text-white/40 text-sm mt-1">Autonomous Incident Report (AIR) analysis using SENTINEL-Gemini logic.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 glass-panel rounded-xl flex items-center gap-3">
              <Activity className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-[8px] text-white/20 uppercase font-black">AI Status</p>
                <p className="text-[10px] font-bold text-white uppercase">Operational</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border-stratum-accent/20 bg-stratum-accent/[0.02]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <Upload className="w-5 h-5 text-stratum-accent" />
                Report Intake
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2 px-1">Incident Description / Raw Text</label>
                  <textarea 
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Paste disaster report or observations here..."
                    className="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-stratum-accent/50 transition-all resize-none custom-scrollbar"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2 px-1">Upload Document (PDF/JPG)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center group-hover:bg-white/5 transition-all group-hover:border-stratum-accent/30">
                      <FileText className="w-8 h-8 text-white/10 mx-auto mb-2 group-hover:text-stratum-accent/50" />
                      <p className="text-xs text-white/30">
                        {selectedFile ? selectedFile.name : 'Click or drop PDF/Image report'}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={analyzing || (!reportText && !selectedFile)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3
                    ${analyzing ? 'bg-white/5 text-white/20' : 'bg-stratum-accent text-black hover:scale-[1.02] active:scale-95'}
                  `}
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {analyzing ? 'Engaging Gemini Reasoning...' : 'Analyze with SENTINEL'}
                </button>
              </div>
            </div>

            {/* Archive List (Moved here) */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] px-1">Recent Archive</h4>
              {loading ? (
                <div className="h-20 animate-pulse glass-panel rounded-2xl opacity-50"></div>
              ) : (
                reports.slice(0, 3).map(report => (
                  <div key={report.id} className="p-4 glass-panel rounded-2xl flex items-center justify-between group hover:bg-white/5 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <FileText className="w-4 h-4 text-white/20 group-hover:text-stratum-accent" />
                      <span className="text-xs font-bold text-white/60">{report.name}</span>
                    </div>
                    <Download className="w-4 h-4 text-white/10 group-hover:text-white" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Analysis Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {analysisResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-10 border border-gray-200 shadow-xl font-mono text-black min-h-[600px] flex flex-col"
                >
                  {/* Terminal Header */}
                  <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter">SENTINEL-GEMINI ANALYSIS v4.0</h2>
                      <p className="text-[10px] mt-1">GENERATED: {analysisResult.generated_at}</p>
                    </div>
                    <div className={`px-4 py-1 border-2 border-black font-black text-sm uppercase ${severityColors[analysisResult.severity]}`}>
                      {analysisResult.severity}
                    </div>
                  </div>

                  <div className="space-y-8 flex-1">
                    {/* Summary Section */}
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold uppercase underline">01. Incident Summary</p>
                       <p className="text-sm leading-relaxed font-bold italic">
                         "{analysisResult.summary}"
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <p className="text-[10px] font-bold uppercase underline">02. Incident Geometry</p>
                          <table className="w-full text-[11px] font-bold">
                             <tbody>
                                <tr className="border-b border-black/10">
                                   <td className="py-1">TYPE:</td>
                                   <td className="py-1 text-right">{analysisResult.disaster_type}</td>
                                </tr>
                                <tr className="border-b border-black/10">
                                   <td className="py-1">AREA:</td>
                                   <td className="py-1 text-right">{analysisResult.affected_area}</td>
                                </tr>
                                <tr className="border-b border-black/10">
                                   <td className="py-1">SCORE:</td>
                                   <td className="py-1 text-right">{analysisResult.severity_score}/10</td>
                                </tr>
                                <tr>
                                   <td className="py-1">ACTION:</td>
                                   <td className={`py-1 text-right uppercase underline`}>{analysisResult.sentinel_signal}</td>
                                </tr>
                             </tbody>
                          </table>
                       </div>

                       <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase underline">03. Key Findings</p>
                          <ul className="text-[10px] font-bold space-y-2">
                             {analysisResult.key_findings.map((f, i) => (
                               <li key={i} className="flex gap-2">
                                 <span>•</span>
                                 <span>{f}</span>
                               </li>
                            ))}
                          </ul>
                       </div>
                    </div>

                    {/* Infrastructure Risk Grid */}
                    <div className="space-y-3">
                       <p className="text-[10px] font-bold uppercase underline">04. Infrastructure Risk Matrix</p>
                       <div className="grid grid-cols-5 gap-2">
                          {Object.entries(analysisResult.infrastructure_risk).map(([key, value]) => (
                            <div key={key} className={`border border-black/20 p-2 text-center ${bgSeverity[value]}`}>
                               <p className="text-[8px] uppercase font-black mb-1">{key}</p>
                               <p className="text-[9px] font-black uppercase underline">{value}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Measures Section */}
                    <div className="space-y-3 bg-black text-white p-6">
                       <p className="text-[10px] font-bold uppercase text-stratum-accent">--- Immediate Response Measures ---</p>
                       <ul className="text-xs space-y-2">
                         {analysisResult.immediate_actions.map((action, i) => (
                           <li key={i} className="flex gap-3 items-center">
                             <div className="w-4 h-4 border border-white/30 flex items-center justify-center text-[10px] font-bold">
                               {i+1}
                             </div>
                             {action}
                           </li>
                         ))}
                       </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-black flex justify-between items-center text-[9px] font-bold opacity-50">
                     <span>AUTHENTICATED BY STRATUM INTELLIGENCE LAYER</span>
                     <span>CONFIDENCE: {(analysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-20">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-white/10" />
                  </div>
                  <h3 className="text-xl font-bold text-white/20 mb-2">AIR INTELLIGENCE STANDBY</h3>
                  <p className="text-sm text-white/10 max-w-xs leading-relaxed">
                    Upload a report document or paste incident text to engage Gemini reasoning engine and generate autonomous analysis.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

