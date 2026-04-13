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
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Upload, label: 'Submissions', path: '/submissions' },
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


      </div>
    </aside>
  );
};

export default Sidebar;
