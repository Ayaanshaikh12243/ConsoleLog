import React, { useState, useRef, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

const FileUploadForm = ({ type, onUpload, onPreviewChange, onReset, isLoading, result }) => {
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
        reader.onloadend = () => {
          setPreview(reader.result);
          if (onPreviewChange) onPreviewChange(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(selectedFile.name);
        if (onPreviewChange) onPreviewChange(selectedFile.name);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (onPreviewChange) onPreviewChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onReset) onReset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const submissionData = new FormData();
    submissionData.append('file', file);
    submissionData.append('contributor_id', formData.contributor_id);
    submissionData.append('location_lat', formData.location_lat);
    submissionData.append('location_lon', formData.location_lon);

    onUpload(submissionData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
          <config.icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">{type} Submission</h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Ground truth verification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative aspect-video rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
            flex flex-col items-center justify-center overflow-hidden
            ${file ? 'border-stratum-accent bg-stratum-accent/5' : 'border-white/5 hover:border-white/10 bg-white/[0.01]'}
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
                className="text-center"
              >
                <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/40 font-medium">Drop {type} here or click</p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full relative"
              >
                {type === 'photo' ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/40">
                    <FileText className="w-12 h-12 text-stratum-accent mb-2" />
                    <span className="text-xs font-mono text-white/60 truncate max-w-[80%]">{preview}</span>
                  </div>
                )}
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white/80 hover:bg-red-500 transition-colors backdrop-blur-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        <button 
          type="submit"
          disabled={!file || isLoading}
          className={`
            w-full p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 flex items-center justify-center gap-3
            ${!file || isLoading ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-stratum-accent text-stratum-dark hover:scale-[1.02] active:scale-[0.98] shadow-2xl'}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Node...</span>
            </>
          ) : (
            <span>Submit Intelligence</span>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default FileUploadForm;
