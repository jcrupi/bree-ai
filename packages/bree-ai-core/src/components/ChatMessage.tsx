import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserIcon, BotIcon, Volume2Icon, ChevronDown, ChevronRight, FileText, Quote } from 'lucide-react';
import { currentBrand } from '../config/branding';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  index: number;
  isSpeaking?: boolean;
  sources?: any[];
  brandColor?: string;
}

export function ChatMessage({ role, content, index, isSpeaking, sources, brandColor = currentBrand.colors.primary }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isLightTheme = currentBrand.name === 'habitaware-ai' || currentBrand.name === 'genius-talent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border`} 
             style={{ 
               backgroundColor: isAssistant ? `${brandColor}15` : brandColor,
               color: isAssistant ? brandColor : '#ffffff',
               borderColor: isAssistant ? `${brandColor}30` : 'transparent'
             }}>
          {isAssistant ? <BotIcon size={18} /> : <UserIcon size={18} />}
        </div>
        
        <div className={`flex flex-col gap-2`}>
          <div className={`rounded-2xl px-4 py-3 text-sm prose prose-sm max-w-none shadow-sm ${
            isAssistant 
              ? isLightTheme ? 'bg-white border border-slate-200 text-slate-800 prose-slate' : 'bg-slate-900/50 border border-slate-800 text-slate-100 prose-invert'
              : 'text-white prose-invert !text-white'
          }`}
          style={{
            backgroundColor: !isAssistant ? brandColor : undefined,
            boxShadow: !isAssistant ? `0 10px 15px -3px ${brandColor}33` : undefined
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="mb-3 list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="mb-3 list-decimal pl-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="marker:text-current">{children}</li>,
                h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-current/20 pl-3 italic my-3 opacity-90">{children}</blockquote>,
                code: ({children}) => <code className="bg-current/10 px-1 rounded font-mono text-[0.8em]">{children}</code>,
                hr: () => <hr className="my-4 border-t border-current/10" />
              }}
            >
              {content || `${currentBrand.displayName} is thinking...`}
            </ReactMarkdown>

            {isSpeaking && (
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-4 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest opacity-80"
                style={{ color: brandColor }}
              >
                <Volume2Icon size={10} />
                <span>Speaking</span>
              </motion.div>
            )}
          </div>

          {/* Collapsible Sources Snippet */}
          {isAssistant && sources && sources.length > 0 && (
            <div className="ml-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b border-transparent hover:border-current py-1"
                style={{ color: brandColor }}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Show Sources ({sources.length})
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className={`space-y-3 p-4 rounded-xl border ${
                      isLightTheme 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-900/40 border-slate-800'
                    }`}>
                      {sources.slice(0, 3).map((source, sIdx) => (
                        <div key={sIdx} className="space-y-1.5">
                          <div className={`flex items-center gap-2 text-[10px] font-medium ${
                            isLightTheme ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                            <FileText size={10} />
                            <span>{source.metadata?.filename || source.collection || 'Document source'}</span>
                            {source.score && <span className="opacity-50">• {Math.round(source.score * 100)}% Match</span>}
                          </div>
                          <div className={`relative pl-3 border-l-2 text-[11px] italic leading-relaxed ${
                            isLightTheme 
                              ? 'border-slate-300 text-slate-800' 
                              : 'border-slate-800 text-slate-300'
                          }`}>
                            <Quote size={8} className="absolute -left-1 top-0 opacity-20" />
                            {source.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


