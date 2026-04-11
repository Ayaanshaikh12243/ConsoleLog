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
  Loader2
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

      {/* Improved Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-br from-[#1e1e2e] to-[#2d2d44] border border-stratum-accent/30 p-6 rounded-xl text-[#e0e0e0] w-full"
          >
            {/* Header */}
            <div className="border-b-2 border-stratum-accent/20 pb-4 mb-6">
              <h3 className="text-stratum-accent text-xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Submission Result
              </h3>
              <p className="text-[#aaa] text-xs font-mono">ID: {result.submission_id}</p>
            </div>

            {/* Status Section */}
            <div className="mb-6 p-4 bg-stratum-accent/5 rounded-lg border-l-4 border-stratum-accent">
              {result.status === 'accepted' ? (
                <>
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-bold mb-2">✅ ACCEPTED</span>
                  <p className="text-[#ccc] text-sm mt-1">Your submission was processed and accepted by the system.</p>
                </>
              ) : result.status === 'review' ? (
                <>
                  <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold mb-2">⚠️ NEEDS REVIEW</span>
                  <p className="text-[#ccc] text-sm mt-1">Your submission needs manual review by an expert.</p>
                </>
              ) : (
                <>
                  <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold mb-2">❌ REJECTED</span>
                  <p className="text-[#ccc] text-sm mt-1">Your submission could not be processed.</p>
                </>
              )}
            </div>

            {/* Damage Analysis */}
            {(type === 'photo' || type === 'video') && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
                <h4 className="text-stratum-accent text-base font-bold mb-3">🔍 Damage Analysis</h4>
                {result.validation && result.validation.recommendation === 'accept' ? (
                  <p className="text-green-400 font-medium m-0">✅ Image appears to be authentic and real.</p>
                ) : (
                  <p className="text-yellow-400 font-medium m-0">⚠️ Media may need verification.</p>
                )}
              </div>
            )}

            {/* Authenticity Checks (Table) */}
            {result.validation && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
                <h4 className="text-stratum-accent text-base font-bold mb-4">🛡️ Authenticity Checks</h4>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    <tr className={`border-b border-stratum-accent/10 ${result.validation.exif_valid ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                      <td className="p-3 text-stratum-accent font-semibold w-2/5">Metadata Valid:</td>
                      <td className="p-3 font-medium text-white">{result.validation.exif_valid ? '✅ Yes' : '⚠️ No metadata'}</td>
                      <td className="p-3 text-[#888] text-xs italic hidden sm:table-cell">Camera info and EXIF data</td>
                    </tr>
                    <tr className={`border-b border-stratum-accent/10 ${result.validation.gps_consistent ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                      <td className="p-3 text-stratum-accent font-semibold">GPS Consistent:</td>
                      <td className="p-3 font-medium text-white">{result.validation.gps_consistent ? '✅ Yes' : '❌ Invalid'}</td>
                      <td className="p-3 text-[#888] text-xs italic hidden sm:table-cell">Location makes sense</td>
                    </tr>
                    <tr className="border-b border-stratum-accent/10 bg-blue-500/5">
                      <td className="p-3 text-stratum-accent font-semibold">Deepfake Risk:</td>
                      <td className="p-3 font-medium text-white">{result.validation.spoofing_risk !== undefined ? (result.validation.spoofing_risk * 100).toFixed(1) : 0}%</td>
                      <td className="p-3 text-[#888] text-xs italic hidden sm:table-cell">{(result.validation.spoofing_risk || 0) < 0.1 ? '✅ Very low' : '⚠️ Possible AI'}</td>
                    </tr>
                    <tr className="bg-blue-500/5">
                      <td className="p-3 text-stratum-accent font-semibold">Image Quality:</td>
                      <td className="p-3 font-medium text-white">{result.validation.image_quality_score !== undefined ? (result.validation.image_quality_score * 100).toFixed(0) : 100}%</td>
                      <td className="p-3 text-[#888] text-xs italic hidden sm:table-cell">{(result.validation.image_quality_score || 1) > 0.5 ? '✅ Good' : '⚠️ Low quality'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Damage Specific (Video/Audio) */}
            {result.damage_type && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
                <h4 className="text-stratum-accent text-base font-bold mb-3">⚠️ Detected Damage</h4>
                <div className="mb-4">
                  <h5 className="text-white text-base float-left font-bold m-0 uppercase tracking-wide">
                    {result.damage_type.replace(/_/g, ' ')}
                  </h5>
                  <div className="clear-both hidden"></div>
                </div>
                
                {/* Confidence Bar */}
                <div className="h-8 bg-black/50 rounded-full border border-stratum-accent/20 overflow-hidden relative mt-4 mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-stratum-accent to-[#0dd9ff] transition-all duration-500" 
                    style={{ width: `${(result.damage_confidence || result.confidence || 0) * 100}%` }}
                  />
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs drop-shadow-md">
                    {((result.damage_confidence || result.confidence || 0) * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                {(() => {
                  const severity = result.damage_severity || result.severity_grade || 'E';
                  return (
                    <>
                      <p className="text-white text-sm mt-3 mb-1 font-medium">Severity: <strong className="text-stratum-accent text-lg">GRADE {severity}</strong></p>
                      <p className="text-[#888] text-xs italic m-0">
                        {severity === 'A' ? 'Critical damage detected' : severity === 'B' ? 'Moderate damage detected' : severity === 'C' ? 'Minor damage detected' : 'Minimal damage detected'}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Disaster Classification (Flask model) */}
            {/* Disaster Classification (Flask model) - PIXEL PERFECT REFERENCE MATCH */}
            {result.disaster_classification && result.disaster_classification.prediction && (
              <div className="mb-6 bg-white p-8 border border-gray-200 shadow-sm font-mono text-black">
                {/* Header: Predicted: [TYPE] | Confidence: [VALUE]% */}
                <h3 className="text-center text-lg font-bold mb-6">
                  Predicted: {result.disaster_classification.prediction.toUpperCase()} | Confidence: {result.disaster_classification.confidence?.toFixed(1)}%
                </h3>

                {/* Primary analyzed image display */}
                {preview && (
                  <div className="flex justify-center mb-10">
                    <img 
                      src={preview} 
                      alt="Disaster Analysis" 
                      className="max-w-full h-auto"
                    />
                  </div>
                )}

                {/* Probabilities list with scientific bar charts */}
                <div className="max-w-md mx-auto">
                  <p className="mb-4">--- All probabilities ---</p>
                  <div className="space-y-1">
                    {Object.entries(result.disaster_classification.all_probabilities || {}).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center gap-4">
                        <span className="w-24 text-left">{cls}</span>
                        <div className="flex-1 h-5 bg-[#222] relative">
                          <div 
                            className="h-full bg-[#444] border-r border-[#666]"
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-bold">{prob.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Spoofing Risk / Authenticity Meter */}
            {result.validation && result.validation.spoofing_risk !== undefined && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
                <h4 className="text-stratum-accent text-base font-bold mb-3">🔐 Authenticity Score</h4>
                
                {(() => {
                  const authenticity = 100 - (result.validation.spoofing_risk * 100);
                  const color = authenticity > 70 ? '#28a745' : authenticity > 40 ? '#ffc107' : '#dc3545';
                  return (
                    <>
                      <div className="h-10 bg-black/50 rounded-full border border-stratum-accent/20 overflow-hidden relative mt-4 mb-3">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ width: `${authenticity}%`, backgroundColor: color }}
                        />
                      </div>
                      <p className="text-white font-bold text-sm mb-1">{authenticity.toFixed(0)}% Authentic</p>
                      <p className="text-[#888] text-xs italic m-0">
                        {authenticity > 80 ? '✅ This appears to be a genuine, unmanipulated image.' : authenticity > 50 ? '⚠️ This image has some characteristics that warrant verification.' : '❌ This image may be manipulated or fake.'}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Contributor Reputation */}
            {result.contributor_trust_score !== undefined && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
                <h4 className="text-stratum-accent text-base font-bold mb-3">👤 Your Reputation Score</h4>
                
                {(() => {
                  const score = result.contributor_trust_score;
                  const tier = score > 0.7 ? 'TRUSTED' : score < 0.4 ? 'QUESTIONABLE' : 'NEUTRAL';
                  const tierColor = score > 0.7 ? 'text-green-500' : score < 0.4 ? 'text-red-500' : 'text-yellow-500';
                  
                  return (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 my-4 p-4 bg-stratum-accent/5 rounded-lg">
                      <span className="text-3xl font-bold text-stratum-accent min-w-[80px]">{score.toFixed(3)}</span>
                      <span className={`text-lg font-bold ${tierColor}`}>{tier}</span>
                    </div>
                  );
                })()}
                <p className="text-[#888] text-xs italic m-0">Based on your submission accuracy and consistency.</p>
              </div>
            )}

            {/* Next Steps */}
            <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-4 border-stratum-accent">
              <h4 className="text-stratum-accent text-base font-bold mb-3">📌 What Happens Next?</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                {result.status === 'accepted' ? (
                  <>
                    <li className="text-[#ccc] text-sm pb-2 border-b border-stratum-accent/10">✅ Your data has been stored</li>
                    <li className="text-[#ccc] text-sm pb-2 border-b border-stratum-accent/10">🛰️ Will be correlated with satellite signals</li>
                    <li className="text-[#ccc] text-sm pb-2 border-b border-stratum-accent/10">📊 Used to build better disaster maps</li>
                    <li className="text-[#ccc] text-sm">🎯 Helps emergency responders</li>
                  </>
                ) : (
                  <>
                    <li className="text-[#ccc] text-sm pb-2 border-b border-stratum-accent/10">⏳ Waiting for expert review</li>
                    <li className="text-[#ccc] text-sm pb-2 border-b border-stratum-accent/10">📧 You'll be notified of decision</li>
                    <li className="text-[#ccc] text-sm">💡 Make sure photo is clear and focused</li>
                  </>
                )}
              </ul>
            </div>

            {/* Raw Data Toggle */}
            <details className="mt-6 p-4 bg-black/50 rounded-lg border border-stratum-accent/10 cursor-pointer group">
              <summary className="text-stratum-accent font-bold select-none group-hover:text-[#0dd9ff]">📋 View Raw JSON Data</summary>
              <pre className="bg-black/70 p-4 rounded-md overflow-x-auto text-[#0dd9ff] text-xs leading-relaxed mt-4">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileUploadForm;
