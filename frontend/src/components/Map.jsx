import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import * as h3 from 'h3-js';

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

// Convert H3 cell ID → Leaflet polygon boundary
const h3ToPolygon = (h3Index) => {
  try {
    const boundary = h3.cellToBoundary(h3Index); // [[lat,lng], ...]
    return boundary; // already [lat, lng] format for Leaflet
  } catch {
    return null;
  }
};

const ClickHandler = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    },
  });
  return null;
};

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
    } catch (e) {}
  }, [map, onScanResult]);

  useEffect(() => {
    if (scanActive) {
      doScan();
      scanRef.current = setInterval(doScan, 15000);
    } else {
      clearInterval(scanRef.current);
    }
    return () => clearInterval(scanRef.current);
  }, [scanActive, doScan]);

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

// ── Single H3 Hex Cell ─────────────────────────────────────────────────────
const HexCell = ({ cell, setLocation, isNeighbor = false }) => {
  const boundary = h3ToPolygon(cell.node_id);
  if (!boundary) return null;

  const color = RISK_COLOR(cell.risk);
  const opacity = isNeighbor ? 0.12 : 0.22;
  const weight = isNeighbor ? 1 : 1.8;

  return (
    <Polygon
      positions={boundary}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: opacity,
        weight: weight,
        dashArray: isNeighbor ? '4 4' : null,
      }}
      eventHandlers={{
        click: () => !isNeighbor && setLocation({ lat: cell.lat, lng: cell.lng }),
      }}
    >
      {!isNeighbor && (
        <Popup className="stratum-popup">
          <div style={{ color: '#000', fontSize: '11px', fontWeight: 'bold' }}>
            <div style={{ color }}>⬡ {cell.node_id?.substring(0, 10)}…</div>
            <div>Risk: {cell.risk}% — {cell.status}</div>
            {cell.alert_type && <div style={{ color: '#ff6b35' }}>⚠ {cell.alert_type}</div>}
            <div style={{ opacity: 0.7 }}>{cell.cause?.substring(0, 60)}</div>
          </div>
        </Popup>
      )}
    </Polygon>
  );
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-grayscale"
        />

        <ClickHandler setLocation={setLocation} />
        <ViewportScanner scanActive={scanActive} onScanResult={onScanResult} />

        {location && <Marker position={[location.lat, location.lng]} />}

        {/* Primary scanned cells as H3 hexagons */}
        {scannedCells.map((cell) => (
          <HexCell key={cell.node_id} cell={cell} setLocation={setLocation} />
        ))}

        {/* Impacted neighbor nodes — dashed lower-opacity hexagons */}
        {scannedCells.flatMap((cell) =>
          (cell.impacted_nodes || []).map((neighbor) => (
            <HexCell
              key={`neighbor-${neighbor.node_id}`}
              cell={{
                node_id: neighbor.node_id,
                lat: cell.lat,   // approximate — neighbors render from H3 boundary directly
                lng: cell.lng,
                risk: neighbor.risk,
              }}
              setLocation={setLocation}
              isNeighbor={true}
            />
          ))
        )}
      </MapContainer>

      <div className="absolute inset-0 pointer-events-none border border-white/5 z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
};

export default Map;