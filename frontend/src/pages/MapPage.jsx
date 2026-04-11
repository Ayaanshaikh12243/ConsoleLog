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


      {/* ── Click hint ── */}
      <AnimatePresence>
        {!selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="glass-panel px-8 py-4 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
              <p className="text-[11px] font-black tracking-[0.3em] text-white/40 uppercase whitespace-nowrap">
                CLICK MAP TO INTERROGATE CELL
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
