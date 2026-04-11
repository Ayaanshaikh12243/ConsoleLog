import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Mic,
  Loader2,
  Shield,
  Zap,
  Fingerprint,
  Search,
  Activity,
  History,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const FileUploadForm = ({ type, onUpload, isLoading, result }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    contributor_id: 'citizen_alpha',
    location_lat: 40.7128,
    location_lon: -74.0060,
  });
  const fileInputRef = useRef(null);

  const typeConfig = {
    photo: { icon: ImageIcon, color: 'text-stratum-risk-low', accept: '.jpg,.jpeg,.png,.webp,.gif', hint: 'jpg, png, webp, gif' },
    video: { icon: Video, color: 'text-stratum-risk-medium', accept: '.mp4,.mov,.avi,.mkv,.webm,.wmv', hint: 'mp4, mov, avi, mkv, webm, wmv' },
    audio: { icon: Mic, color: 'text-stratum-risk-high', accept: '.mp3,.wav,.m4a,.ogg,.aac,.flac', hint: 'mp3, wav, m4a, ogg, aac, flac' },
  };

  const config = typeConfig[type];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (type === 'photo') {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(selectedFile.name);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const submissionData = new FormData();
    submissionData.append('file', file);
    submissionData.append('contributor_id', formData.contributor_id);
    submissionData.append('location_lat', formData.location_lat);
    submissionData.append('location_lon', formData.location_lon);
    submissionData.append('timestamp', new Date().toISOString());

    onUpload(submissionData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.02]"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-2xl bg-${type}-accent/10 ${config.color}`}>
          <config.icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold capitalize">{type} Submission</h2>
          <p className="text-white/40 text-sm">Ground truth verification via {type}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Dropzone */}
        <div 
          onClick={() => !file && fileInputRef.current?.click()}
          className={`
            relative h-48 rounded-2xl border-2 border-dashed transition-all duration-300
            flex flex-col items-center justify-center cursor-pointer overflow-hidden
            ${file ? 'border-stratum-accent/50 bg-stratum-accent/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={config.accept}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/40">Drop {type} here or click to browse</p>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mt-2">{config.hint}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full p-4 flex items-center justify-center relative"
              >
                {type === 'photo' ? (
                  <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center text-stratum-accent">
                    <FileText className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{preview}</span>
                  </div>
                )}
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Latitude</label>
            <input 
              type="number" 
              step="any"
              value={formData.location_lat}
              onChange={(e) => setFormData({...formData, location_lat: e.target.value === '' ? '' : parseFloat(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-stratum-accent/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Longitude</label>
            <input 
              type="number" 
              step="any"
              value={formData.location_lon}
              onChange={(e) => setFormData({...formData, location_lon: e.target.value === '' ? '' : parseFloat(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-stratum-accent/50 transition-colors"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={!file || isLoading}
          className={`
            w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
            ${!file || isLoading ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-stratum-accent text-stratum-dark hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,242,255,0.3)]'}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Node Integrity...</span>
            </>
          ) : (
            <span>Submit Intelligence</span>
          )}
        </button>
      </form>

      {/* Enhanced Intelligence Brief */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 pt-6 border-t border-white/5 space-y-5"
          >
            {/* Brief Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-stratum-accent/10 rounded-lg">
                   <Zap className="w-3 h-3 text-stratum-accent" />
                 </div>
                 <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Autonomous Briefing</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${result.status === 'accepted' ? 'bg-risk-low/10 text-risk-low border-risk-low/20' : 'bg-risk-high/10 text-risk-high border-risk-high/20'}`}>
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {/* Metadata & Authenticity Matrix */}
               <div className="glass-panel p-4 rounded-2xl border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Fingerprint className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Validation Matrix</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-[8px] text-white/20 uppercase font-black mb-1">Authenticity Score</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{((1 - (result.validation?.spoofing_risk || 0)) * 100).toFixed(0)}%</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-stratum-accent w-[96%]"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-white/20 uppercase font-black mb-1">Node Reputation</p>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3 h-3 text-risk-low" />
                        <span className="text-[10px] font-black text-white uppercase">{result.contributor_trust_score?.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-white/20 uppercase font-black">EXIF</span>
                      <span className={`text-[9px] font-bold ${result.validation?.exif_valid ? 'text-risk-low' : 'text-risk-high'}`}>
                        {result.validation?.exif_valid ? 'SECURE' : 'VOID'}
                      </span>
                    </div>
                    <div className="flex flex-col text-center">
                      <span className="text-[7px] text-white/20 uppercase font-black">GPS SYNC</span>
                      <span className={`text-[9px] font-bold ${result.validation?.gps_consistent ? 'text-risk-low' : 'text-risk-high'}`}>
                        {result.validation?.gps_consistent ? 'VERIFIED' : 'DRIFT'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[7px] text-white/20 uppercase font-black">QUALITY</span>
                      <span className="text-[9px] font-bold text-stratum-accent">
                        {Math.round((result.validation?.image_quality_score || 0) * 100)}%
                      </span>
                    </div>
                  </div>
               </div>

               {/* Damage & Causal Analysis */}
               <div className="glass-panel p-4 rounded-2xl border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <Activity className="w-3 h-3 text-risk-high" />
                       <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Damage Vector</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/20">CONFIDENCE: {Math.round((result.damage_confidence || 0) * 100)}%</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1">
                        {result.damage_type?.replace('_', ' ') || 'ANALYSIS PENDING'}
                      </h4>
                      <p className="text-[10px] text-white/40 italic leading-none">Severity Grade: <span className="text-stratum-accent font-black">{result.damage_severity || 'E'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-white/20 uppercase font-black mb-1">Priority</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${result.damage_severity === 'A' || result.damage_severity === 'B' ? 'bg-risk-high text-white' : 'bg-risk-low/20 text-risk-low'}`}>
                         {result.damage_severity === 'A' || result.damage_severity === 'B' ? 'CRITICAL' : 'ROUTINE'}
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Neural Summary */}
            {(result.prediction || result.analysis) && (
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <p className="text-[10px] text-white/60 leading-relaxed italic">
                  "{result.analysis || result.prediction}"
                </p>
              </div>
            )}

            {/* Protocol Summary & Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-white/5">
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Protocol Pipeline</p>
                   <div className="flex flex-col gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-risk-low mt-1.5 shrink-0"></div>
                        <span className="text-[10px] text-white/50 font-medium leading-tight">Data Ingested & Persistent</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-stratum-accent mt-1.5 shrink-0 animate-pulse"></div>
                        <span className="text-[10px] text-white/50 font-medium leading-tight">SENTINEL-7 Correlation Active</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 shrink-0"></div>
                        <span className="text-[10px] text-white/30 font-medium leading-tight">Disaster Mapping Propagation</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col justify-between items-end">
                   <div className="flex gap-6 mb-4">
                    <div className="flex flex-col text-right">
                      <span className="text-[7px] text-white/20 uppercase font-black tracking-widest mb-1">H3 CELL</span>
                      <span className="text-[9px] font-mono text-white/40 leading-none">{result.h3_cell?.slice(0, 10)}</span>
                    </div>
                    <div className="flex flex-col text-right border-l border-white/5 pl-6">
                      <span className="text-[7px] text-white/20 uppercase font-black tracking-widest mb-1">PAYLOAD</span>
                      <span className="text-[9px] font-mono text-white/40 leading-none">JSON-V1</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-white/5"></div>
                    <details className="group relative">
                      <summary className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] hover:text-stratum-accent transition-all cursor-pointer list-none py-1 px-3 glass-panel rounded-full border border-white/5 hover:border-stratum-accent/20">
                        [TELEMETRY]
                      </summary>
                      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-6 md:p-20">
                         <div className="pointer-events-auto max-w-2xl w-full glass-panel p-8 rounded-[2rem] border-stratum-accent/20 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_0_100px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-stratum-accent/10 rounded-xl">
                                  <Activity className="w-4 h-4 text-stratum-accent" />
                                </div>
                                <span className="text-xs font-black text-white tracking-widest uppercase">System Raw Export</span>
                              </div>
                              <button onClick={(e) => e.target.closest('details').open = false} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                                <X className="w-5 h-5"/>
                              </button>
                            </div>
                            <pre className="text-[11px] text-stratum-accent/60 font-mono leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                            <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                               <p className="text-[8px] font-black text-white/10 uppercase tracking-widest">End of Telemetry Log</p>
                            </div>
                         </div>
                      </div>
                    </details>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileUploadForm;
