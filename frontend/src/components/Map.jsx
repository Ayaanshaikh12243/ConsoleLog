import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE = 'http://localhost:8000/api';

const RISK_COLOR = (risk) => {
  if (risk > 70) return '#ff3d00';
  if (risk > 35) return '#ffcc00';
  return '#00f2ff';
};

// ── Click Handler ──────────────────────────────────────────────────────────
const ClickHandler = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    },
  });
  return null;
};

// ── Viewport Scanner ───────────────────────────────────────────────────────
const ViewportScanner = ({ scanActive, onScanResult }) => {
  const map = useMap();
  const scanRef = useRef(null);

  const doScan = useCallback(async () => {
    const bounds = map.getBounds();
    const params = {
      lat_min: bounds.getSouth(),
      lat_max: bounds.getNorth(),
      lng_min: bounds.getWest(),
      lng_max: bounds.getEast(),
    };
    try {
      const res = await axios.get(`${API_BASE}/scan`, { params });
      if (res.data?.cells) onScanResult(res.data.cells);
    } catch (e) {
      // silently skip on error
    }
  }, [map, onScanResult]);

  useEffect(() => {
    if (scanActive) {
      doScan(); // immediate first scan
      scanRef.current = setInterval(doScan, 15000); // then every 15s
    } else {
      clearInterval(scanRef.current);
    }
    return () => clearInterval(scanRef.current);
  }, [scanActive, doScan]);

  // Also scan when map moves (with debounce)
  useMapEvents({
    moveend() {
      if (scanActive) {
        clearTimeout(scanRef.moveDebounce);
        scanRef.moveDebounce = setTimeout(doScan, 800);
      }
    }
  });

  return null;
};

// ── Main Map Component ─────────────────────────────────────────────────────
const Map = ({ setLocation, location, scanActive, onScanResult, scannedCells }) => {
  useEffect(() => {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
  }, []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#0a0a0b' }}
      >
        {/* OSM tiles with dark invert filter — rich premium dark look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-grayscale"
        />

        <ClickHandler setLocation={setLocation} />
        <ViewportScanner scanActive={scanActive} onScanResult={onScanResult} />

        {/* Clicked location marker */}
        {location && <Marker position={[location.lat, location.lng]} />}

        {/* Auto-scanned cells as colored hex circles */}
        {scannedCells.map((cell) => (
          <CircleMarker
            key={cell.node_id}
            center={[cell.lat, cell.lng]}
            radius={14}
            pathOptions={{
              color: RISK_COLOR(cell.risk),
              fillColor: RISK_COLOR(cell.risk),
              fillOpacity: 0.25,
              weight: 1.5,
            }}
            eventHandlers={{
              click: () => setLocation({ lat: cell.lat, lng: cell.lng }),
            }}
          >
            <Popup className="stratum-popup">
              <div style={{ color: '#000', fontSize: '11px', fontWeight: 'bold' }}>
                <div style={{ color: RISK_COLOR(cell.risk) }}>⬡ {cell.node_id?.substring(0, 10)}…</div>
                <div>Risk: {cell.risk}% — {cell.status}</div>
                <div style={{ opacity: 0.7 }}>{cell.cause?.substring(0, 60)}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Overlay vignette */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
};

export default Map;
