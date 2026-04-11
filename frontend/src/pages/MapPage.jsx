import React, { useEffect, useState, useCallback } from 'react';
import Map from '../components/Map';
import Dashboard from '../components/Dashboard';
import useStore from '../store/useStore';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, ScanLine, Radio } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

const MapPage = () => {
  const { selectedLocation, setSelectedLocation, cellData, setCellData, setLoading, setError } = useStore();
  const [scanActive, setScanActive] = useState(false);
  const [scannedCells, setScannedCells] = useState([]);
  const [scanCount, setScanCount] = useState(0);

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

      {/* ── Scan Toggle Button ── */}
      <div className="absolute top-6 left-6 z-20 flex flex-col space-y-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setScanActive(s => !s); if (!scanActive) setScannedCells([]); }}
          className={`flex items-center space-x-3 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl ${scanActive
              ? 'bg-stratum-accent text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]'
              : 'glass-panel text-white/60 hover:text-white border border-white/10'
            }`}
        >
          {scanActive ? (
            <><Radio className="w-4 h-4 animate-pulse" /><span>Scanning Active</span></>
          ) : (
            <><ScanLine className="w-4 h-4" /><span>Auto Scan</span></>
          )}
        </motion.button>

        {/* Scan stats */}
        <AnimatePresence>
          {scanActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel px-4 py-2 rounded-xl border border-white/10 space-y-1"
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-stratum-accent rounded-full animate-ping" />
                <span className="text-[9px] font-black text-stratum-accent uppercase tracking-widest">
                  {scannedCells.length} cells scanned
                </span>
              </div>
              <div className="text-[9px] text-white/30 font-bold">
                Scan #{scanCount} • 15s interval
              </div>
              {/* Risk breakdown */}
              {scannedCells.length > 0 && (
                <div className="flex space-x-3 mt-1 pt-1 border-t border-white/5">
                  <span className="text-[8px] text-risk-high font-bold">
                    🔴 {scannedCells.filter(c => c.risk > 70).length} CRIT
                  </span>
                  <span className="text-[8px] text-risk-medium font-bold">
                    🟡 {scannedCells.filter(c => c.risk > 35 && c.risk <= 70).length} WARN
                  </span>
                  <span className="text-[8px] text-risk-low font-bold">
                    🟢 {scannedCells.filter(c => c.risk <= 35).length} OK
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global scan status */}
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center space-x-3 border border-white/5">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Global Scan:</span>
          <span className="text-xs font-mono text-stratum-accent">ACTIVE</span>
        </div>
      </div>

      {/* ── Click hint ── */}
      <AnimatePresence>
        {!selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="glass-panel px-6 py-3 rounded-2xl animate-bounce">
              <p className="text-[10px] font-bold tracking-widest text-white/60">
                CLICK MAP TO INTERROGATE CELL — OR ENABLE AUTO SCAN
              </p>
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
