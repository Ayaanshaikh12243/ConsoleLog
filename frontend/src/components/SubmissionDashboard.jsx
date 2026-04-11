import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  Mic,
  LayoutDashboard,
  History,
  Info,
  Loader2,
  Shield,
  Zap
} from 'lucide-react';
import FileUploadForm from './FileUploadForm';
import ContributorStats from './ContributorStats';
import NodeGovernance from './NodeGovernance';
import SystemLogs from './SystemLogs';
import { predictDisaster, submitVideo, submitAudio, getContributorReputation } from '../services/api';
import {
  X,
  CheckCircle2,
  FileText,
  Globe,
  Activity,
  Database,
  BarChart3,
  Search
} from 'lucide-react';

const SubmissionDashboard = () => {
  const [activeTab, setActiveTab] = useState('photo');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [contributorId] = useState('citizen_alpha');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getContributorReputation(contributorId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUpload = async (formData) => {
    setIsLoading(true);
    setResult(null);
    try {
      let data;
      if (activeTab === 'photo') data = await predictDisaster(formData);
      else if (activeTab === 'video') data = await submitVideo(formData);
      else data = await submitAudio(formData);

      setResult(data);
      setShowModal(true);
      fetchStats(); // Update stats after submission
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'photo', icon: Camera, label: 'Photo' },
    { id: 'video', icon: Video, label: 'Video' },
    { id: 'audio', icon: Mic, label: 'Audio' },
  ];

  return (
    <>
      <div className="p-4 lg:p-10 h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-stratum-accent animate-pulse"></div>
                <span className="text-[10px] font-black text-stratum-accent uppercase tracking-[0.3em]">Operational Unit</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">FIELD INTELLIGENCE</h1>
              <p className="text-white/40 max-w-xl text-sm leading-relaxed">
                Submit visual, temporal, or spatial data to corroborrate planetary intelligence node baselines. All submissions are processed through the STRATUM real-time inference engine.
              </p>
            </div>
            <div className="hidden lg:flex gap-4">
              <div className="p-3 px-6 glass-panel rounded-2xl flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-white/20 uppercase font-black">Node Status</p>
                  <p className="text-xs font-black text-stratum-accent">ONLINE</p>
                </div>
                <div className="w-1.5 h-10 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-2/3 bg-stratum-accent w-full animate-pulse-slow"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Controls */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tab Navigation */}
              <div className="flex p-1.5 glass-panel rounded-2xl w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setResult(null); }}
                    className={`
                    flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300
                    ${activeTab === tab.id ? 'bg-stratum-accent text-stratum-dark shadow-lg' : 'text-white/40 hover:text-white'}
                  `}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1">
                  <FileUploadForm
                    type={activeTab}
                    onUpload={handleUpload}
                    onPreviewChange={setPreview}
                    onReset={() => { setResult(null); setPreview(null); }}
                    isLoading={isLoading}
                    result={result}
                  />
                </div>

                <div className="col-span-1 space-y-8">
                  <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-6">
                      <Info className="w-4 h-4 text-stratum-accent" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Submission Protocol</h3>
                    </div>
                    <div className="space-y-4 text-xs text-white/40 leading-relaxed font-medium">
                      <p>
                        1. <span className="text-white/80">Coordinate Sync:</span> Node telemetry automatically captures and corroborates your incident location.
                      </p>
                      <p>
                        2. <span className="text-white/80">Asset Integrity:</span> Media must be untampered. Deepfake or duplicate assets will be flagged by SENTINEL-7.
                      </p>
                      <p>
                        3. <span className="text-white/80">Process Time:</span> Audio/Video analysis may take up to 2,000ms per node cycle.
                      </p>
                    </div>

                  </div>

                  <SystemLogs />
                </div>
              </div>
            </div>

            {/* Right Sidebar: Stats & Governance */}
            <div className="lg:col-span-4 h-fit sticky top-0 space-y-8">
              <ContributorStats stats={stats} />
              <NodeGovernance />
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION ANALYSIS MODAL */}
      <AnimatePresence>
        {showModal && result && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] glass-panel rounded-[2.5rem] border-white/10 shadow-3xl overflow-hidden relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-stratum-accent/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-stratum-accent/20 border border-stratum-accent/30">
                    <Activity className="w-5 h-5 text-stratum-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 text-stratum-accent tracking-[0.4em] font-black text-[10px] uppercase">
                      Planetary Node Verification
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Intelligence Output: {result.disaster_classification?.prediction || result.damage_type || 'ANALYZED'}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Visual Section */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-square group bg-black/40 flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt="Analysis Source" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                      ) : (
                        <Search className="w-12 h-12 text-white/10 animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                      {/* Corner Markers */}
                      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-stratum-accent opacity-30"></div>
                      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-stratum-accent opacity-30"></div>

                      <div className="absolute bottom-6 left-8 right-8">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-[9px] font-black text-stratum-accent uppercase tracking-widest">Inference Weight</p>
                            <p className="text-xl font-black text-white uppercase tracking-tight">{(result.disaster_classification?.confidence || (result.damage_confidence || 0.95) * 100).toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Node ID</p>
                            <p className="text-xs font-mono text-white/60">STRATUM-{result.submission_id?.slice(-6).toUpperCase() || 'ALPHA'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 text-center">Protocol</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse"></div>
                          <span className="text-xs font-black text-white uppercase">VERIFIED</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 text-center">Latency</p>
                        <p className="text-xs font-black text-stratum-accent text-center">842ms</p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Section */}
                  <div className="lg:col-span-7 space-y-10">
                    {/* Probabilities */}
                    {result.disaster_classification && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <BarChart3 className="w-4 h-4 text-stratum-accent" />
                          <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Cross-Node Probabilities</span>
                        </div>
                        <div className="space-y-5">
                          {Object.entries(result.disaster_classification.all_probabilities || {}).sort((a, b) => b[1] - a[1]).map(([cls, prob]) => (
                            <div key={cls} className="group">
                              <div className="flex justify-between items-center mb-1.5 px-1">
                                <span className={`text-[10px] uppercase font-black tracking-widest ${cls.toLowerCase() === result.disaster_classification.prediction.toLowerCase() ? 'text-stratum-accent' : 'text-white/30'}`}>
                                  {cls}
                                </span>
                                <span className="text-[10px] font-mono text-stratum-accent/60 font-bold">{prob.toFixed(1)}%</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${prob}%` }}
                                  className={`h-full ${cls.toLowerCase() === result.disaster_classification.prediction.toLowerCase() ? 'bg-stratum-accent shadow-[0_0_10px_rgba(0,242,255,0.4)]' : 'bg-white/10'}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Globe className="w-4 h-4 text-stratum-accent" />
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Sentinel Narrative</span>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-stratum-accent/[0.03] border border-stratum-accent/10 relative group">
                        <div className="absolute -top-1 -right-1 p-2">
                          <Database className="w-4 h-4 text-stratum-accent opacity-10 animate-spin-slow" />
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed font-bold italic">
                          "Visual heuristics matched {result.disaster_classification?.prediction || 'environmental abnormality'} pattern. GPS metadata corroboration confirms temporal alignment with satellite overpass. Incident has been logged to SCRIBE for consensus."
                        </p>
                      </div>
                    </div>

                    {/* Next Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-5 rounded-2xl bg-stratum-accent text-stratum-dark font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Commit & Close
                      </button>
                      <button
                        onClick={() => { setShowModal(false); setResult(null); setPreview(null); }}
                        className="p-5 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/5"
                      >
                        Discard Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubmissionDashboard;
