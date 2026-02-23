import React, { useState } from 'react';
import { Bot, Bug, Lightbulb, Zap, Send, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// Isolated custom modal to ensure flawless injection onto any Bree app canvas
const ObserverModal = ({ isOpen, onClose, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

export function ObserverAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const captureAndSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);
    
    try {
      // Hide the observer button temporarily so it isn't in the screenshot
      const fab = document.getElementById('observer-ai-fab');
      if (fab) fab.style.display = 'none';

      // Capture the screen
      const canvas = await html2canvas(document.body, {
        scale: 1, // Keep scale manageable for Base64 sizing
        useCORS: true,
        logging: false
      });
      
      const screenshotData = canvas.toDataURL('image/webp', 0.5); // WebP format at 50% quality
      
      if (fab) fab.style.display = 'flex';

      // Send to Identity Zero Gateway
      const response = await fetch('/api/identity-zero/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || ''}`
        },
        body: JSON.stringify({
          app_name: document.title || 'Unknown App',
          page_url: window.location.pathname,
          type,
          description,
          screenshot_data: screenshotData
        })
      });

      if (!response.ok) throw new Error('Submission failed');
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription('');
        setType('bug');
      }, 2000);

    } catch (error) {
      console.error("Observer capture failed:", error);
      alert("Failed to submit observation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        id="observer-ai-fab"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9998] bg-violet-600 hover:bg-violet-700 text-white rounded-full p-4 shadow-lg shadow-violet-500/30 transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Bot size={24} className="group-hover:animate-bounce" />
      </button>

      <ObserverModal isOpen={isOpen} onClose={() => !isSubmitting && setIsOpen(false)}>
        <div className="bg-violet-600 p-6 text-white text-center">
          <Bot size={40} className="mx-auto mb-3 text-violet-200" />
          <h2 className="text-xl font-bold tracking-tight">Observer.ai</h2>
          <p className="text-violet-200 text-sm mt-1">Capture insights, bugs, or ideas instantly.</p>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center bg-white">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-semibold text-slate-800">Observation Captured!</h3>
            <p className="text-slate-500 mt-2 text-sm">Thank you for helping improve Bree.</p>
          </div>
        ) : (
          <div className="p-6 bg-slate-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setType('bug')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${type === 'bug' ? 'bg-red-50 border-red-200 text-red-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Bug size={20} className="mb-1" /> Bug
                  </button>
                  <button 
                    onClick={() => setType('enhancement')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${type === 'enhancement' ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Zap size={20} className="mb-1" /> Enhance
                  </button>
                  <button 
                    onClick={() => setType('new_feature')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors ${type === 'new_feature' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Lightbulb size={20} className="mb-1" /> Feature
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you observe?"
                  className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={captureAndSubmit}
                disabled={isSubmitting || !description.trim()}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Capturing Screen...</>
                ) : (
                  <><Send size={18} /> Submit Observation</>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">A screenshot will be automatically attached.</p>
          </div>
        )}
      </ObserverModal>
    </>
  );
}
