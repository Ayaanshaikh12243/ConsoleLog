import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Activity, Award } from 'lucide-react';

const ContributorStats = ({ stats }) => {
  if (!stats) return null;

  const getTierColor = (tier) => {
    switch(tier) {
      case 'HIGH': return 'text-stratum-risk-low';
      case 'LOW': return 'text-stratum-risk-high';
      default: return 'text-stratum-accent';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.02] h-full"
    >
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-5 h-5 text-stratum-accent" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Contributor Identity</h3>
      </div>

      <div className="space-y-8">
        {/* Trust Score Gauge */}
        <div className="relative flex flex-col items-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * (stats.trust_score || 0.5))}
              className={`${getTierColor(stats.tier)} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{Math.round((stats.trust_score || 0.5) * 100)}</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Trust</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <Target className="w-4 h-4 text-white/20 mb-2" />
            <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Accuracy</p>
            <p className="text-lg font-black">{Math.round((stats.accuracy_rate || 0) * 100)}%</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <Activity className="w-4 h-4 text-white/20 mb-2" />
            <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Signals</p>
            <p className="text-lg font-black">{stats.submission_count || 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className={`w-5 h-5 ${getTierColor(stats.tier)}`} />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Reputation Tier</p>
              <p className={`text-sm font-black ${getTierColor(stats.tier)}`}>{stats.tier || 'NEUTRAL'}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Action</p>
             <p className="text-[10px] font-black uppercase text-stratum-risk-low">{stats.recommendation || 'ACCEPT'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContributorStats;
