import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import Dashboard from '../components/Dashboard';
import useStore from '../store/useStore';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, ScanLine, Radio, ShieldAlert, Cpu, AlertTriangle, Volume2 } from 'lucide-react';

const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

const API_BASE_URL = 'http://localhost:8000/api';

const MapPage = () => {
    const { selectedLocation, setSelectedLocation, cellData, setCellData, setLoading, setError, setActivePage } = useStore();
    const [scanActive, setScanActive] = useState(false);
    const [scannedCells, setScannedCells] = useState([]);
    const [scanCount, setScanCount] = useState(0);
    const [activeAlert, setActiveAlert] = useState(null);
    const navigate = useNavigate();

    const playAlertSound = () => {
        const audio = new Audio(ALERT_SOUND_URL);
        audio.volume = 0.4;
        audio.play().catch(e => console.log("Sound blocked by browser policy"));
    };

    useEffect(() => {
        if (cellData?.alert) {
            setActiveAlert(cellData.alert);
            playAlertSound();
            // Show toast for 15s instead of 10s to give time to click
            const timer = setTimeout(() => setActiveAlert(null), 15000);
            return () => clearTimeout(timer);
        } else {
            setActiveAlert(null);
        }
    }, [cellData]);

    const handleViewLogs = () => {
        setActivePage('Alerts');
        navigate('/alerts');
    };

  // Initial fetch: Load all historical cells from MongoDB
  useEffect(() => {
    const fetchAllCells = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/cells/all`);
        // Filter out those with null lat/lng
        const validCells = (res.data || []).filter(c => c.lat && c.lng);
        setScannedCells(validCells);
      } catch (e) {
        console.error("Initial cell fetch failed:", e);
      }
    };
    fetchAllCells();
  }, []);

  // Fetch full cell intelligence when user clicks a point
  useEffect(() => {
    const fetchCellData = async () => {
      if (!selectedLocation) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/cell`, {
          params: { lat: selectedLocation.lat, lng: selectedLocation.lng }
        });
        setCellData(response.data);

        // Add this new clicked point to our scanned list if not already there
        setScannedCells(prev => {
          if (prev.find(c => c.node_id === response.data.node_id)) return prev;
          return [...prev, response.data];
        });
      } catch (err) {
        console.error('Cell fetch error:', err);
        setError('Connection failed. Backend may be offline.');
      } finally {
        setLoading(false);
      }
    };
    fetchCellData();
  }, [selectedLocation]);

  // Receive scan results: merge with existing cells (deduplicate by node_id)
  const handleScanResult = useCallback((newCells) => {
    setScannedCells(prev => {
      const existingIds = new Set(prev.map(c => c.node_id));
      const filteredNew = newCells.filter(c => !existingIds.has(c.node_id));
      return [...prev, ...filteredNew];
    });
    setScanCount(c => c + 1);
  }, []);

  return (
    <div className="flex-1 h-full relative overflow-hidden">
      <Map
        location={selectedLocation}
        setLocation={setSelectedLocation}
        scanActive={scanActive}
        onScanResult={handleScanResult}
        scannedCells={scannedCells}
      />


      {/* ── Predictive Alert Toast (Corner) ── */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="absolute top-24 right-6 z-[100] w-[28rem] px-4"
          >
            <div className={`relative overflow-hidden p-6 rounded-3xl border shadow-2xl bg-black/90 backdrop-blur-2xl ${
              activeAlert.risk > 75 ? 'border-risk-high animate-pulse-slow' : 'border-white/10'
            }`}>
              <div className={`absolute inset-0 opacity-5 ${
                activeAlert.risk > 75 ? 'bg-risk-high' : 'bg-stratum-accent'
              }`} />
              
              <div className="flex items-start gap-4 relative z-10">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  activeAlert.risk > 75 ? 'bg-risk-high/20 text-risk-high' : 'bg-stratum-accent/20 text-stratum-accent'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">Critical Alert Detected</span>
                  </div>
                  <h3 className="text-sm font-black text-white tracking-tight leading-tight mb-4">
                    {activeAlert.message}
                  </h3>
                  
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={handleViewLogs}
                        className="flex-1 py-2 bg-stratum-accent rounded-xl text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                     >
                        Enter Alert Hub
                     </button>
                     <button 
                        onClick={() => setActiveAlert(null)}
                        className="px-4 py-2 border border-white/10 rounded-xl text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                     >
                        Ignore
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashboard Panel ── */}
      <AnimatePresence>
        {cellData && (
          <Dashboard
            cell={{ ...cellData, hex: `LAT:${cellData.lat?.toFixed(4)} LNG:${cellData.lng?.toFixed(4)}` }}
            onClose={() => { setCellData(null); setSelectedLocation(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapPage;
