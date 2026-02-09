import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bug, Sparkles, Zap, X, Send, User, Mail, MessageCircle } from 'lucide-react';
import { api } from '../utils/api-client';
import { currentBrand } from '../config/branding';

interface FeedbackButtonProps {
  brandColor?: string;
}

type FeedbackType = 'bug' | 'feature' | 'enhancement';

export function FeedbackButton({ brandColor = '#3b82f6' }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feature');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.api.feedback.post({
        type,
        name,
        email: email || undefined,
        description,
        metadata: {
          brand: currentBrand.name,
          source: 'ai_feedback_button',
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });

      if (response.data?.success) {
        setIsSent(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSent(false);
          setName('');
          setEmail('');
          setDescription('');
        }, 2000);
      } else {
        console.error('Failed to send feedback:', response.error);
        alert('Failed to send feedback. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const types = [
    { id: 'bug' as FeedbackType, label: 'Bug', icon: Bug, color: '#ef4444' },
    { id: 'feature' as FeedbackType, label: 'New Feature', icon: Sparkles, color: '#8b5cf6' },
    { id: 'enhancement' as FeedbackType, label: 'Enhancement', icon: Zap, color: '#f59e0b' },
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2 text-white group"
        style={{ backgroundColor: brandColor }}
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium">
          AI Feedback
        </span>
      </motion.button>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              className="fixed bottom-24 right-6 z-[70] w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Share Feedback</h3>
                    <p className="text-slate-500 text-sm">Help us improve the AI experience</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {isSent ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-64 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="p-4 bg-green-100 text-green-600 rounded-full">
                      <Send size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">Thanks for the feedback!</h4>
                      <p className="text-slate-500">Your ideas help us get better.</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Feedback Type Selection */}
                    <div className="grid grid-cols-3 gap-3">
                      {types.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            type === t.id 
                              ? 'border-transparent shadow-md text-white' 
                              : 'border-slate-100 text-slate-600 hover:border-slate-200 bg-slate-50'
                          }`}
                          style={{ 
                            backgroundColor: type === t.id ? t.color : undefined 
                          }}
                        >
                          <t.icon size={20} />
                          <span className="text-xs font-bold leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="text"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>

                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="Email (Optional)"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>

                      <div className="relative">
                        <MessageCircle size={18} className="absolute left-4 top-4 text-slate-400" />
                        <textarea
                          required
                          placeholder="What would make this better?"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl text-white font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Send size={18} />
                      Send Feedback
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
