import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmailJS } from '@bree-ai/core';

export function EmailJSTestPage() {
  const [lastResult, setLastResult] = useState<any>(null);

  const config = {
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'AV4YHk7N0-WlI8U4h',
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id',
  };

  return (
    <div className="min-h-screen bg-[#0a090a] text-slate-200 font-sans flex flex-col p-8">
      <nav className="mb-12">
        <Link to="/" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
          <ArrowLeft size={18} />
          <span>Back to Hub</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-4">EmailJS Integration</h1>
            <p className="text-slate-400 leading-relaxed">
              Test the new premium EmailJS component. This component allows you to catch leads, 
              feedback, or contact requests directly in your inbox without a backend.
            </p>
          </div>

          <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Info size={20} />
              <h3 className="font-bold uppercase tracking-wider text-sm">Configuration Info</h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <p><span className="text-slate-500">Public Key:</span> <span className="text-indigo-300">{config.publicKey}</span></p>
              <p><span className="text-slate-500">Service ID:</span> <span className="text-indigo-300">{config.serviceId}</span></p>
              <p><span className="text-slate-500">Template ID:</span> <span className="text-indigo-300">{config.templateId}</span></p>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Note: You must set VITE_EMAILJS_SERVICE_ID and VITE_EMAILJS_TEMPLATE_ID in your .env to send real emails.
            </p>
          </div>

          {lastResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl"
            >
              <h3 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-wider">Last Send Result</h3>
              <pre className="text-[10px] font-mono text-emerald-300 overflow-auto">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>

        <div>
          <EmailJS 
            config={config}
            brandColor="#10b981"
            title="Contact Support"
            subtitle="How can our AI experts help you today?"
            onSuccess={(res) => setLastResult(res)}
          />
        </div>
      </main>

      <footer className="mt-auto pt-12 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          Bree AI · Premium Communications Suite
        </p>
      </footer>
    </div>
  );
}
