import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Cpu, Layers, HardDrive } from 'lucide-react';
import useStore from '../store/useStore';

const SettingsPage = () => {
  const { layers, toggleLayer } = useStore();

  const sections = [
    {
      title: "Geospatial Visualization",
      icon: Layers,
      settings: [
        { label: "Global Risk Heatmap", key: "heatmap", active: layers.heatmap },
        { label: "Predictive Node Display", key: "nodes", active: layers.nodes },
        { label: "Infrastructure Overlay", key: "infrastructure", active: layers.infrastructure },
      ]
    },
    {
        title: "Agent Fleet Protocols",
        icon: Cpu,
        settings: [
          { label: "Autonomous Intervention", key: "autonomous", active: true },
          { label: "Distributed Reasoning", key: "reasoning", active: true },
        ]
      }
  ];

  return (
    <div className="p-10 bg-stratum-dark h-full">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">System Configuration</h2>
            <p className="text-white/40 text-[11px] tracking-wide">Fine-tune the STRATUM core protocols and visual layers.</p>
        </header>

        <div className="space-y-12">
            {sections.map((section, idx) => (
                <section key={idx}>
                    <div className="flex items-center space-x-3 mb-6">
                        <section.icon className="w-5 h-5 text-stratum-accent" />
                        <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.2em]">{section.title}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.settings.map((setting) => (
                            <div 
                                key={setting.key}
                                className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/5 active:scale-95 transition-all"
                            >
                                <span className="text-xs font-bold text-white/80">{setting.label}</span>
                                <button 
                                    onClick={() => toggleLayer(setting.key)}
                                    className={`w-12 h-6 rounded-full p-1 transition-all duration-500 relative ${
                                        setting.active ? 'bg-stratum-accent' : 'bg-white/10'
                                    }`}
                                >
                                    <motion.div 
                                        animate={{ x: setting.active ? 24 : 0 }}
                                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
