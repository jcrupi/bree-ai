/**
 * Observer AI Button Component
 * Floating button and modal for capturing user observations
 */

import { useState } from 'react';
import { Bot, Bug, Lightbulb, Zap, Send, Loader2, CheckCircle2, X } from 'lucide-react';

interface ObserverButtonProps {
  position?: 'sidebar' | 'floating';
}

export function ObserverButton({ position = 'floating' }: ObserverButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'enhancement' | 'feature'>('bug');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          description: description.trim(),
          url: window.location.pathname
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit observation');
      }

      const data = await response.json();
      console.log('Observer Submission:', data.observation);

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription('');
        setType('bug');
      }, 2000);
    } catch (error) {
      console.error('Observer submission failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit observation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (position === 'sidebar') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-violet-500 hover:to-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-105"
          title="Observer AI"
        >
          <Bot className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" strokeWidth={2} />

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl z-50">
            Observer AI
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </button>

        <ObserverModal
          isOpen={isOpen}
          onClose={() => !isSubmitting && setIsOpen(false)}
          type={type}
          setType={setType}
          description={description}
          setDescription={setDescription}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  // Floating FAB version
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9998] bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-full p-4 shadow-lg shadow-violet-500/30 transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Bot size={24} className="group-hover:animate-bounce" />
      </button>

      <ObserverModal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        type={type}
        setType={setType}
        description={description}
        setDescription={setDescription}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        onSubmit={handleSubmit}
      />
    </>
  );
}

interface ObserverModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'bug' | 'enhancement' | 'feature';
  setType: (type: 'bug' | 'enhancement' | 'feature') => void;
  description: string;
  setDescription: (value: string) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
  onSubmit: () => void;
}

function ObserverModal({
  isOpen,
  onClose,
  type,
  setType,
  description,
  setDescription,
  isSubmitting,
  isSuccess,
  onSubmit,
}: ObserverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Observer.ai</h2>
                <p className="text-violet-100 text-sm mt-1">
                  Capture insights instantly
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center bg-white">
            <CheckCircle2
              size={48}
              className="mx-auto text-green-500 mb-4 animate-bounce"
            />
            <h3 className="text-lg font-semibold text-slate-800">
              Observation Captured!
            </h3>
            <p className="text-slate-500 mt-2 text-sm">
              Thank you for helping improve FatCRM.
            </p>
          </div>
        ) : (
          <div className="p-6 bg-slate-50">
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setType('bug')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${
                      type === 'bug'
                        ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bug size={20} className="mb-1" />
                    Bug
                  </button>
                  <button
                    onClick={() => setType('enhancement')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${
                      type === 'enhancement'
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Zap size={20} className="mb-1" />
                    Enhance
                  </button>
                  <button
                    onClick={() => setType('feature')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${
                      type === 'feature'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lightbulb size={20} className="mb-1" />
                    Feature
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Details
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you observe? Be specific..."
                  className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-slate-800"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting || !description.trim()}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-lg hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Observation
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              Current page will be automatically recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
