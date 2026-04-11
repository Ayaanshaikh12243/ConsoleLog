import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, Download, Clock, ExternalLink } from 'lucide-react';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/reports');
        setReports(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="p-10 bg-stratum-dark min-h-full">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Intelligence Archive</h2>
            <p className="text-white/40 text-sm">Generated reports for monitored planetary sectors.</p>
        </header>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 glass-panel animate-pulse rounded-3xl"></div>)}
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {reports.map((report, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={report.id}
                        className="glass-panel p-6 rounded-3xl flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer border border-white/5 hover:border-stratum-accent/30"
                    >
                        <div className="flex items-center space-x-6">
                            <div className="w-14 h-14 bg-stratum-accent/10 rounded-2xl flex items-center justify-center text-stratum-accent">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white group-hover:text-stratum-accent transition-colors">{report.name}</h3>
                                <div className="flex items-center space-x-4 mt-1">
                                    <div className="flex items-center space-x-1.5 text-white/30 text-xs">
                                        <Clock className="w-3 h-3" />
                                        <span>Generated: {report.date}</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 rounded-full text-white/40 border border-white/10 uppercase">PDF v1.0</span>
                                </div>
                            </div>
                        </div>
                        <button className="p-3 bg-white/5 rounded-xl text-white/40 group-hover:bg-stratum-accent group-hover:text-black transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                    </motion.div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
