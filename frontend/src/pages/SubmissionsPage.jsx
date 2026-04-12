import React, { useState, useRef, useCallback } from 'react';
import {
  Navigation, Camera, MapPin, Zap, Send, CheckCircle2,
  AlertTriangle, Loader2, RefreshCw, ChevronDown
} from 'lucide-react';

const API = 'http://localhost:8000';

const EVENT_TYPES = [
  { id: 'FLOOD',      label: 'Flood',      emoji: '🌊' },
  { id: 'EARTHQUAKE', label: 'Earthquake',  emoji: '🌍' },
  { id: 'LANDSLIDE',  label: 'Landslide',  emoji: '🏔️' },
  { id: 'FIRE',       label: 'Fire',        emoji: '🔥' },
  { id: 'CYCLONE',    label: 'Cyclone',     emoji: '🌪️' },
  { id: 'OTHER',      label: 'Other',       emoji: '⚠️' },
];

const LOADING_MESSAGES = [
  'Analyzing image…',
  'Checking historical data…',
  'Computing threat score…',
];

/* ── tiny helpers ─────────────────────────────────── */
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.82);
    };
    img.src = url;
  });
}

/* ── styles ───────────────────────────────────────── */
const S = {
  page:    { background: '#0a0a0b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', padding: '0 0 80px' },
  inner:   { width: '100%', maxWidth: 480, padding: '24px 20px 0' },
  logo:    { color: '#00f2ff', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', marginBottom: 32, textTransform: 'uppercase' },
  h1:      { fontSize: 28, fontWeight: 800, margin: '0 0 8px' },
  sub:     { color: '#9ca3af', fontSize: 14, margin: '0 0 32px', lineHeight: 1.5 },
  btn:     { width: '100%', padding: '16px', borderRadius: 14, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.15s' },
  btnTeal: { background: '#00f2ff', color: '#0a0a0b' },
  btnGhost:{ background: 'transparent', color: '#9ca3af', fontSize: 13, padding: '10px', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  card:    { background: '#111115', border: '1px solid #1e1e24', borderRadius: 18, padding: 24, marginBottom: 16 },
  dot:     (active) => ({ width: 8, height: 8, borderRadius: '50%', background: active ? '#00f2ff' : '#2a2a30', transition: 'background 0.2s' }),
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  evtBtn:  (sel) => ({ background: sel ? 'rgba(0,242,255,0.12)' : '#111115', border: `2px solid ${sel ? '#00f2ff' : '#1e1e24'}`, borderRadius: 14, padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s' }),
  evtEmoji:{ fontSize: 28 },
  evtLabel:{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' },
  photoBox:(hasImg) => ({ border: `2px dashed ${hasImg ? '#00f2ff' : '#2a2a30'}`, borderRadius: 16, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 16, background: '#0d0d10' }),
  preview: { position: 'absolute', inset: 0, objectFit: 'cover', width: '100%', height: '100%', borderRadius: 16 },
  textarea:{ width: '100%', background: '#111115', border: '1px solid #1e1e24', borderRadius: 12, color: '#e5e7eb', padding: '14px', fontSize: 14, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  chip:    { background: '#1a1a20', border: '1px solid #2a2a30', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#9ca3af', cursor: 'pointer', whiteSpace: 'nowrap' },
  summRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #1e1e24' },
  label:   { color: '#6b7280', fontSize: 13 },
  value:   { color: '#e5e7eb', fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: 220 },
};

export default function SubmissionsPage() {
  const [step, setStep]               = useState(1);
  const [coords, setCoords]           = useState(null);
  const [locationName, setLocName]    = useState('');
  const [locationError, setLocErr]    = useState(false);
  const [manualMode, setManual]       = useState(false);
  const [manualLat, setMLat]          = useState('');
  const [manualLng, setMLng]          = useState('');
  const [eventType, setEvt]           = useState(null);
  const [description, setDesc]        = useState('');
  const [photo, setPhoto]             = useState(null);
  const [photoPreview, setPreview]    = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [loadMsg, setLoadMsg]         = useState(0);
  const [result, setResult]           = useState(null);
  const fileRef                       = useRef();

  /* ── step 1: location ────────────────────────────── */
  const detectLocation = useCallback(() => {
    setLocErr(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'User-Agent': 'STRATUM/1.0' } });
          const j = await r.json();
          setLocName((j.display_name || `${lat.toFixed(3)}, ${lng.toFixed(3)}`).slice(0, 40));
        } catch { setLocName(`${lat.toFixed(3)}, ${lng.toFixed(3)}`); }
        setTimeout(() => setStep(2), 1000);
      },
      () => setLocErr(true),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const applyManual = () => {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    setCoords({ lat, lng });
    setLocName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setTimeout(() => setStep(2), 400);
  };

  /* ── step 3: photo ───────────────────────────────── */
  const onPhotoChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const compressed = await compressImage(f);
    setPhoto(compressed);
    setPreview(URL.createObjectURL(compressed));
  };

  const appendChip = (txt) => setDesc(d => d ? `${d} ${txt}` : txt);

  /* ── step 4: submit ──────────────────────────────── */
  const submit = async () => {
    setSubmitting(true);
    setLoadMsg(0);
    const interval = setInterval(() => setLoadMsg(m => (m + 1) % LOADING_MESSAGES.length), 2000);
    try {
      const fd = new FormData();
      fd.append('lat', coords.lat);
      fd.append('lng', coords.lng);
      fd.append('description', description);
      fd.append('event_type', eventType);
      if (photo) fd.append('photo', photo);
      const res = await fetch(`${API}/api/submit`, { method: 'POST', body: fd });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: true, credibility: 0 });
    } finally {
      clearInterval(interval);
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1); setCoords(null); setLocName(''); setLocErr(false);
    setManual(false); setEvt(null); setDesc(''); setPhoto(null);
    setPreview(null); setResult(null);
  };

  /* ── full-screen loader ──────────────────────────── */
  if (submitting) return (
    <div style={{ ...S.page, justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 size={48} color="#00f2ff" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#00f2ff', marginTop: 24, fontSize: 15, fontWeight: 600 }}>{LOADING_MESSAGES[loadMsg]}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── result screen ───────────────────────────────── */
  if (result) {
    const score = result.credibility ?? 0;
    const isHigh = score >= 60, isMid = score >= 30 && score < 60;
    const accent = isHigh ? '#22c55e' : isMid ? '#eab308' : '#6b7280';
    return (
      <div style={{ ...S.page, justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>
          {isHigh ? '✅' : isMid ? '⚠️' : '📋'}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: accent, margin: '0 0 8px' }}>
          {isHigh ? 'ALERT DISPATCHED' : isMid ? 'REPORT RECEIVED' : 'REPORT LOGGED'}
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 24px' }}>
          {isHigh ? 'Authorities have been notified' : isMid ? 'Under expert review' : 'Thank you for reporting'}
        </p>
        <div style={{ background: '#111115', border: `2px solid ${accent}`, borderRadius: 18, padding: 24, maxWidth: 360, width: '100%', margin: '0 auto 32px' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: accent }}>{score}/100</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Credibility Score</div>
          {result.historical_text && (
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>{result.historical_text}</p>
          )}
          {result.keras_prediction && (
            <p style={{ color: '#00f2ff', fontSize: 12, marginTop: 8 }}>
              AI detected: {result.keras_prediction.toUpperCase()} ({result.keras_confidence.toFixed(1)}%)
            </p>
          )}
        </div>
        <button style={{ ...S.btn, ...S.btnTeal, maxWidth: 320 }} onClick={reset}>
          <RefreshCw size={18} /> Submit Another Report
        </button>
      </div>
    );
  }

  /* ── progress dots ───────────────────────────────── */
  const Dots = () => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
      {[1,2,3,4].map(n => <div key={n} style={S.dot(step === n)} />)}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <Dots />

        {/* ── STEP 1 ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={S.logo}>⚡ STRATUM · Citizen Sentinel</div>
            <h1 style={S.h1}>Where are you?</h1>
            <p style={S.sub}>We need your location to analyze the threat in your area.</p>

            {!coords ? (
              <>
                <button style={{ ...S.btn, ...S.btnTeal, marginBottom: 16 }} onClick={detectLocation}>
                  <MapPin size={20} /> Detect My Location
                </button>
                {locationError && (
                  <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                    ⚠️ Could not get location. Try manual entry.
                  </p>
                )}
                <button style={S.btnGhost} onClick={() => setManual(m => !m)}>
                  Enter manually <ChevronDown size={12} style={{ verticalAlign: 'middle' }} />
                </button>
                {manualMode && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <input value={manualLat} onChange={e => setMLat(e.target.value)} placeholder="Latitude" type="number" style={{ flex: 1, ...S.textarea, height: 44, resize: 'none' }} />
                    <input value={manualLng} onChange={e => setMLng(e.target.value)} placeholder="Longitude" type="number" style={{ flex: 1, ...S.textarea, height: 44, resize: 'none' }} />
                    <button style={{ ...S.btn, ...S.btnTeal, width: 'auto', padding: '0 18px' }} onClick={applyManual}>Go</button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ ...S.card, borderColor: '#22c55e', background: 'rgba(34,197,94,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>✅</div>
                <p style={{ margin: '8px 0 0', color: '#22c55e', fontWeight: 700 }}>{locationName}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={S.logo}>⚡ STRATUM · Citizen Sentinel</div>
            <h1 style={S.h1}>What are you seeing?</h1>
            <p style={S.sub}>Select the type of event happening near you.</p>
            <div style={S.grid2}>
              {EVENT_TYPES.map(ev => (
                <button key={ev.id} style={S.evtBtn(eventType === ev.id)} onClick={() => { setEvt(ev.id); setTimeout(() => setStep(3), 300); }}>
                  <span style={S.evtEmoji}>{ev.emoji}</span>
                  <span style={S.evtLabel}>{ev.label.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 ─────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={S.logo}>⚡ STRATUM · Citizen Sentinel</div>
            <h1 style={S.h1}>Show us what's happening</h1>
            <p style={S.sub}>A photo helps verify your report and improves accuracy.</p>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onPhotoChange} />
            <div style={S.photoBox(!!photoPreview)} onClick={() => fileRef.current.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="preview" style={S.preview} />
              ) : (
                <>
                  <Camera size={32} color="#4b5563" />
                  <span style={{ color: '#4b5563', fontSize: 14 }}>Tap to take a photo</span>
                </>
              )}
            </div>

            <textarea
              rows={4} value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe what you see… (optional)"
              style={{ ...S.textarea, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {['Road blocked', 'Building damage', 'People need help'].map(c => (
                <button key={c} style={S.chip} onClick={() => appendChip(c)}>{c}</button>
              ))}
            </div>

            <button style={{ ...S.btn, ...S.btnTeal }} onClick={() => setStep(4)}>
              Continue <Send size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 4 ─────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={S.logo}>⚡ STRATUM · Citizen Sentinel</div>
            <h1 style={S.h1}>Review & Submit</h1>
            <p style={S.sub}>Confirm your report before sending.</p>

            <div style={S.card}>
              {photoPreview && (
                <img src={photoPreview} alt="report" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
              )}
              <div style={S.summRow}>
                <span style={S.label}>📍 Location</span>
                <span style={S.value}>{locationName || `${coords?.lat?.toFixed(4)}, ${coords?.lng?.toFixed(4)}`}</span>
              </div>
              <div style={{ ...S.summRow, borderBottom: 'none' }}>
                <span style={S.label}>Event</span>
                <span style={S.value}>{EVENT_TYPES.find(e => e.id === eventType)?.emoji} {eventType}</span>
              </div>
              {description && (
                <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>"{description}"</p>
              )}
            </div>

            <button style={{ ...S.btn, ...S.btnTeal, marginBottom: 12 }} onClick={submit}>
              <Zap size={20} /> SUBMIT REPORT
            </button>
            <p style={{ color: '#4b5563', fontSize: 12, textAlign: 'center' }}>Your report is anonymous</p>
          </div>
        )}
      </div>
    </div>
  );
}
