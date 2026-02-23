import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, Users, Network } from 'lucide-react';
import { saveVillage } from '../utils/talentVillages';

export function TalentVillageSetup() {
  const navigate = useNavigate();
  const [villageName, setVillageName] = useState('');
  const [villageDescription, setVillageDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim() || !villageDescription.trim() || !leadName.trim()) return;
    
    setIsSubmitting(true);
    
    // Generate a unique ID for the village's communication channels
    const villageId = crypto.randomUUID();

    // Persist village to localStorage for the villages list
    saveVillage({
      villageId,
      villageName: villageName.trim(),
      description: villageDescription.trim(),
      leadName: leadName.trim(),
      createdAt: new Date().toISOString(),
    });

    // Simulate brief processing state for premium feel
    setTimeout(() => {
      // Redirect to the board with the necessary parameters
      navigate(`/talent-village?villageId=${villageId}&role=expert&name=${encodeURIComponent(leadName.trim())}&isLead=true&villageName=${encodeURIComponent(villageName.trim())}&description=${encodeURIComponent(villageDescription.trim())}`);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">
              Genius<span className="text-indigo-600">Talent.ai</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Village Setup</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white/50 p-10 md:p-14 relative overflow-hidden">
            {/* Top Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

            <div className="text-center space-y-4 mb-12">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center text-indigo-600 shadow-inner mb-6"
              >
                <Network size={40} className="text-indigo-600" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Start a New Village
              </h1>
              <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                Create an isolated, real-time environment to assess candidates alongside your expert team.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
              <div className="space-y-6">
                {/* Village Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Village Name</label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={villageName}
                      onChange={(e) => setVillageName(e.target.value)}
                      placeholder="e.g., Senior Full Stack Engineering"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Village Description Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Village Description</label>
                  <div className="group relative">
                     <textarea
                      required
                      value={villageDescription}
                      onChange={(e) => setVillageDescription(e.target.value)}
                      placeholder="Describe the purpose of this village..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none h-24"
                    />
                  </div>
                </div>

                {/* Lead Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Your Name (Lead Expert)</label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g., Sarah Chen"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 ml-2 font-medium">As the creator, you will automatically be assigned the Lead Expert role.</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!villageName.trim() || !villageDescription.trim() || !leadName.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl py-4 pt-5 px-6 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Initializing Environment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="text-indigo-200" />
                    <span className="text-lg">Deploy Village</span>
                    <ArrowRight size={20} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
