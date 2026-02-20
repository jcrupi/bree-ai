import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EmailJSProps {
  config: EmailJSConfig;
  title?: string;
  subtitle?: string;
  brandColor?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  fields?: Array<{
    name: string;
    label: string;
    type?: 'text' | 'email' | 'textarea';
    required?: boolean;
    placeholder?: string;
  }>;
}

/**
 * A premium EmailJS component for Bree AI.
 * Allows sending emails directly from the frontend using EmailJS.
 */
export function EmailJS({
  config,
  title = "Get in Touch",
  subtitle = "We'd love to hear from you. Send us a message!",
  brandColor = "#3b82f6",
  onSuccess,
  onError,
  fields = [
    { name: 'user_name', label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
    { name: 'user_email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
    { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help?' },
  ]
}: EmailJSProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSending(true);
    setStatus('idle');

    try {
      const result = await emailjs.sendForm(
        config.serviceId,
        config.templateId,
        formRef.current,
        {
          publicKey: config.publicKey,
        }
      );

      console.log('✅ Email sent successfully:', result.text);
      setStatus('success');
      onSuccess?.(result);
      
      // Reset form after success
      formRef.current.reset();
      
      // Auto-reset status after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      setStatus('error');
      setErrorMessage(error.text || 'An unexpected error occurred. Please try again.');
      onError?.(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#0f0e0f] rounded-[32px] border border-slate-200 dark:border-emerald-500/20 shadow-2xl overflow-hidden">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-2.5 rounded-xl text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <Mail size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
        </div>

        <form ref={formRef} onSubmit={sendEmail} className="space-y-6">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-emerald-500/60 uppercase tracking-widest pl-1">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-emerald-900/30 rounded-2xl px-5 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-emerald-900/50 focus:border-blue-500 dark:focus:border-emerald-500/50 focus:ring-0 transition-all resize-none outline-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-emerald-900/30 rounded-2xl px-5 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-emerald-900/50 focus:border-blue-500 dark:focus:border-emerald-500/50 focus:ring-0 transition-all outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm"
              >
                <CheckCircle size={18} />
                <span>Message sent successfully!</span>
                <button 
                  type="button" 
                  onClick={() => setStatus('idle')}
                  className="ml-auto text-emerald-500 hover:text-emerald-400"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-sm"
              >
                <AlertCircle size={18} />
                <span className="flex-1">{errorMessage}</span>
                <button 
                  type="button" 
                  onClick={() => setStatus('idle')}
                  className="text-rose-500 hover:text-rose-400"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSending || status === 'success'}
            className="w-full py-4 rounded-2xl text-white font-bold shadow-xl shadow-blue-500/20 dark:shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            style={{ backgroundColor: brandColor }}
          >
            {isSending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={20} />
                <span>Sent!</span>
              </>
            ) : (
              <>
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="px-8 py-4 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-emerald-900/10 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-900/50 uppercase tracking-[0.2em]">Secure Email Channel</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </div>
      </div>
    </div>
  );
}
