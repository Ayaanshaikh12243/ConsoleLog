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
import { submitPhoto, submitVideo, submitAudio, getContributorReputation } from '../services/api';

const SubmissionDashboard = () => {
  const [activeTab, setActiveTab] = useState('photo');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
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
      if (activeTab === 'photo') data = await submitPhoto(formData);
      else if (activeTab === 'video') data = await submitVideo(formData);
      else data = await submitAudio(formData);
      
      setResult(data);
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
                       1. <span className="text-white/80">Coordinate Accuracy:</span> Ensure GPS data matches your current location for valid corroboration.
                     </p>
                     <p>
                       2. <span className="text-white/80">Asset Integrity:</span> Media must be untampered. Deepfake or duplicate assets will be flagged by SENTINEL-7.
                     </p>
                     <p>
                       3. <span className="text-white/80">Process Time:</span> Audio/Video analysis may take up to 2,000ms per node cycle.
                     </p>
                   </div>
                   {/* Integrated Results Display */}
                   <AnimatePresence>
                     {result && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0 }}
                         className="mt-6 pt-6 border-t border-white/5 space-y-4"
                       >
                         <div className={`p-4 rounded-2xl glass-panel border-l-2 ${result.status === 'accepted' || result.status === 'PROCESSED' ? 'border-risk-low' : 'border-risk-high'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Inference Code</span>
                              <Zap className="w-3 h-3 text-stratum-accent" />
                            </div>
                            <p className="text-sm font-black text-white uppercase tracking-tighter">
                              {result.status || 'PROCESSED'}
                            </p>
                         </div>

                         {(result.prediction || result.analysis) && (
                           <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                             <p className="text-[10px] text-white/60 leading-relaxed italic">
                               "{result.analysis || result.prediction}"
                             </p>
                           </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
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
  );
};

export default SubmissionDashboard;
