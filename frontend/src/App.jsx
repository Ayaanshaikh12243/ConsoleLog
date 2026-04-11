import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';

import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import UploadsPage from './pages/UploadsPage';
import AlertsPage from './pages/AlertsPage';
import SubmissionDashboard from './components/SubmissionDashboard';

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-stratum-dark text-white overflow-hidden flex flex-col font-inter">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          
          <main className="flex-1 h-full relative overflow-y-auto custom-scrollbar bg-stratum-dark">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />

              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/uploads" element={<UploadsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/submissions" element={<SubmissionDashboard />} />
            </Routes>
          </main>
        </div>

        {/* Ticker Bottom Bar */}
        <footer className="h-8 glass-panel border-t border-white/5 flex items-center px-4 z-50 overflow-hidden">
          <div className="flex items-center space-x-6 text-[10px] font-mono tracking-wider whitespace-nowrap">
            <span className="text-white/40">NODE-ID: ALPHA</span>
            <span className="text-white/40">|</span>
            <span className="text-stratum-accent uppercase">Fleet Status: Operational</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
