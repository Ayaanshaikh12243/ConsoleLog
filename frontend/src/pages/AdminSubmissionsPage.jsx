import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Camera, MapPin, CheckCircle2, XCircle,
  Clock, AlertTriangle, Zap, Loader2, Eye, TrendingUp
} from 'lucide-react';

const API = 'http://localhost:8000';

const TYPE_COLORS = {
  FLOOD:      { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#22c55e'  },
  EARTHQUAKE: { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#ef4444'  },
  LANDSLIDE:  { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#f97316'  },
  FIRE:       { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#ef4444'  },
  CYCLONE:    { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#a855f7'  },
  OTHER:      { bg: 'rgba(107,114,128,0.15)',border: '#6b7280', text: '#6b7280'  },
};

const STATUS_COLORS = {
  PENDING:      { bg: 'rgba(234,179,8,0.15)',   text: '#eab308'  },
  APPROVED:     { bg: 'rgba(34,197,94,0.15)',   text: '#22c55e'  },
  REJECTED:     { bg: 'rgba(107,114,128,0.15)', text: '#6b7280'  },
  AUTO_ALERTED: { bg: 'rgba(0,242,255,0.12)',   text: '#00f2ff'  },
  HIGH_CREDIBILITY: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
};

const scoreColor = (s) => s >= 60 ? '#22c55e' : s >= 30 ? '#eab308' : '#6b7280';
const eventEmoji = { FLOOD: '🌊', EARTHQUAKE: '🌍', LANDSLIDE: '🏔️', FIRE: '🔥', CYCLONE: '🌪️', OTHER: '⚠️' };

function Badge({ label, style }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 6, padding: '2px 8px', border: '1px solid', ...style }}>
      {label}
    </span>
  );
}

function SubmissionCard({ sub, onApprove, onReject }) {
  const tc = TYPE_COLORS[sub.event_type] || TYPE_COLORS.OTHER;
  const sc = STATUS_COLORS[sub.status]   || STATUS_COLORS.PENDING;
  const color = scoreColor(sub.credibility);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px 20px', marginBottom: 12, display: 'flex', gap: 16 }}>
      {/* photo */}
      <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: 14, overflow: 'hidden', background: '#111115', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sub.photo_url
          ? <img src={`${API}${sub.photo_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Camera size={28} color="#4b5563" />}
      </div>

      {/* center */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
            <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {sub.location}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge label={`${eventEmoji[sub.event_type] || '⚠️'} ${sub.event_type}`}
            style={{ background: tc.bg, borderColor: tc.border, color: tc.text }} />

          {sub.keras_prediction && (
            <Badge label={`AI: ${sub.keras_prediction.toUpperCase()} ${(sub.keras_confidence * 100).toFixed(1)}%`}
              style={{ background: 'rgba(0,242,255,0.1)', borderColor: '#00f2ff', color: '#00f2ff' }} />
          )}

          <Badge label={sub.status.replace('_', ' ')}
            style={{ background: sc.bg, borderColor: sc.text, color: sc.text }} />
        </div>

        {sub.description && (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {sub.description}
          </p>
        )}

        {sub.historical_text && (
          <p style={{ color: '#6b7280', fontSize: 11, margin: '0 0 4px' }}>
            <TrendingUp size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {sub.historical_text}
          </p>
        )}

        <p style={{ color: '#4b5563', fontSize: 11, margin: 0 }}>
          <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {new Date(sub.submitted_at).toLocaleString()}
        </p>

        {/* score bar */}
        <div style={{ height: 3, background: '#1e1e24', borderRadius: 3, marginTop: 10 }}>
          <div style={{ height: '100%', width: `${sub.credibility}%`, background: color, borderRadius: 3, transition: 'width 0.6s' }} />
        </div>
      </div>

      {/* right: score + actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 70 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{sub.credibility}</div>
          <div style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.1em', marginTop: 2 }}>SCORE</div>
        </div>

        {sub.status === 'PENDING' && (
          <>
            <button onClick={() => onApprove(sub.id)}
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              ✓ APPROVE
            </button>
            <button onClick={() => onReject(sub.id)}
              style={{ background: 'rgba(107,114,128,0.12)', border: '1px solid #6b7280', color: '#6b7280', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              ✗ REJECT
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const FILTERS = ['ALL', 'PENDING', 'HIGH', 'REJECTED'];

export default function AdminSubmissionsPage() {
  const [submissions, setSubs]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');

  const fetchSubs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/submissions`);
      const data = await res.json();
      setSubs(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSubs();
    const id = setInterval(fetchSubs, 15000);
    return () => clearInterval(id);
  }, [fetchSubs]);

  const approve = async (id) => {
    await fetch(`${API}/api/submissions/${id}/approve`, { method: 'POST' });
    fetchSubs();
  };
  const reject = async (id) => {
    await fetch(`${API}/api/submissions/${id}/reject`, { method: 'POST' });
    fetchSubs();
  };

  const filtered = submissions.filter(s => {
    if (filter === 'PENDING')  return s.status === 'PENDING';
    if (filter === 'HIGH')     return s.credibility >= 60;
    if (filter === 'REJECTED') return s.status === 'REJECTED';
    return true;
  });

  const total     = submissions.length;
  const pending   = submissions.filter(s => s.status === 'PENDING').length;
  const highCred  = submissions.filter(s => s.credibility >= 60).length;
  const autoAlert = submissions.filter(s => s.status === 'AUTO_ALERTED').length;

  const btnStyle = (active) => ({
    background: active ? 'rgba(0,242,255,0.12)' : 'transparent',
    border: `1px solid ${active ? '#00f2ff' : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#00f2ff' : '#9ca3af',
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '28px 28px 80px', maxWidth: 900, margin: '0 auto' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid rgba(0,242,255,0.3)', borderRadius: 14, padding: '10px 14px' }}>
          <Shield size={22} color="#00f2ff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f1f5f9' }}>CITIZEN SENTINEL</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Ground-truth verification queue</p>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total',          value: total,     icon: <Eye size={14} />,       color: '#00f2ff' },
          { label: 'Pending',        value: pending,   icon: <Clock size={14} />,     color: '#eab308' },
          { label: 'High Credibility', value: highCred, icon: <CheckCircle2 size={14} />, color: '#22c55e' },
          { label: 'Auto-Alerted',   value: autoAlert, icon: <Zap size={14} />,       color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, color: s.color }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} style={btnStyle(filter === f)} onClick={() => setFilter(f)}>
            {f === 'HIGH' ? 'HIGH CREDIBILITY' : f}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <Loader2 size={36} color="#00f2ff" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80, color: '#4b5563' }}>
          <Camera size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
          <p style={{ fontSize: 15 }}>No citizen reports in queue.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Share <strong style={{ color: '#00f2ff' }}>/submit</strong> with field teams.</p>
        </div>
      ) : (
        filtered.map(sub => (
          <SubmissionCard key={sub.id} sub={sub} onApprove={approve} onReject={reject} />
        ))
      )}
    </div>
  );
}
