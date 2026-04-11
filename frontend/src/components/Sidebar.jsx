import React from 'react';
import { 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  Cpu, 
  FileText, 
  Database,
  Search,
  ChevronRight,
  Globe,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import useStore from '../store/useStore';

const Sidebar = () => {
  const { setActivePage } = useStore();

  const menuItems = [
    { icon: Globe, label: 'Map', path: '/' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Upload, label: 'Submissions', path: '/submissions' },
    { icon: Database, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-20 lg:w-72 glass-panel border-r border-white/10 z-50 flex flex-col shrink-0">
      <div className="p-4 lg:p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
        {/* Navigation */}
        <nav className="space-y-4 flex-1">
          {menuItems.map((item, idx) => (
            <NavLink 
              key={idx}
              to={item.path}
              onClick={() => setActivePage(item.label)}
              className={({ isActive }) => `
                w-full flex items-center p-3.5 rounded-2xl transition-all duration-300 relative group
                ${isActive ? 'bg-stratum-accent/10 text-stratum-accent' : 'text-white/40 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 lg:mr-4 transition-transform group-hover:scale-110" />
              <span className="hidden lg:block text-sm font-medium tracking-tight">{item.label}</span>
              <ChevronRight className="hidden lg:block ml-auto w-4 h-4 opacity-0 group-hover:opacity-20 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Node Health Mini Panel */}
        <div className="mt-10 pt-8 border-t border-white/10 hidden lg:block">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Unit Integrity</h4>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/60">CORTEX-X1</span>
                <div className="w-1.5 h-1.5 bg-stratum-accent rounded-full animate-pulse shadow-[0_0_8px_#00f2ff]"></div>
              </div>
              <div className="h-0.5 bg-white/5 w-full rounded-full overflow-hidden">
                <div className="h-full bg-stratum-accent w-3/4"></div>
              </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
