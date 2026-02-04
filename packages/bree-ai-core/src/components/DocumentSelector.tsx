import React, { useState } from 'react';
import { currentBrand } from '../config/branding';
import { motion, AnimatePresence } from 'framer-motion';
import { FileTextIcon, ChevronDownIcon, CheckIcon } from 'lucide-react';
interface Document {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'processing' | 'error';
  pageCount?: number;
}
interface DocumentSelectorProps {
  documents: Document[];
  selectedId: string;
  onSelect: (id: string) => void;
  collectionName?: string;
  documentCount?: number;
}
export function DocumentSelector({
  documents,
  selectedId,
  onSelect,
  collectionName,
  documentCount
}: DocumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDoc = documents.find(d => d.id === selectedId);
  return <div className="relative">
      {/* Main Card */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="relative">
        {/* Selected Document Display */}
        <motion.button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`w-full rounded-2xl border-2 shadow-2xl backdrop-blur-sm overflow-hidden transition-all duration-500 ${
            currentBrand.name === 'habitaware-ai'
              ? 'bg-white border-slate-200'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-blue-500/40 shadow-blue-500/20'
          }`}
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${
              currentBrand.name === 'habitaware-ai' 
                ? 'from-[#D448AA]/5 via-transparent to-[#00A99D]/5' 
                : 'from-blue-500/10 via-transparent to-purple-500/10'
            }`}
          />

          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                currentBrand.name === 'habitaware-ai' ? 'bg-[#D448AA]/10' : 'bg-slate-700/60'
              }`}>
                <FileTextIcon className={`w-8 h-8 ${currentBrand.name === 'habitaware-ai' ? 'text-[#D448AA]' : 'text-blue-400'}`} />
              </div>

              <div className="flex-1 text-left">
                <div className={`text-[10px] uppercase tracking-[0.15em] mb-1 font-bold ${
                  currentBrand.name === 'habitaware-ai' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Current Collection
                </div>
                <h3 className={`text-lg font-semibold ${
                  currentBrand.name === 'habitaware-ai' ? 'text-slate-800' : 'text-white'
                }`}>
                  {collectionName || selectedDoc?.title || 'No Collection'}
                </h3>
              </div>

              {/* Dropdown arrow */}
              <motion.div animate={{
              rotate: isOpen ? 180 : 0
            }} transition={{
              duration: 0.3
            }} className="text-slate-400">
                <ChevronDownIcon className="w-6 h-6" />
              </motion.div>
            </div>

            {/* Status and metadata */}
            <div className="flex items-center justify-between mt-auto">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                currentBrand.name === 'habitaware-ai' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                Live
              </span>
              <div className={`text-[10px] font-bold uppercase tracking-tight ${currentBrand.name === 'habitaware-ai' ? 'text-slate-500' : 'text-slate-400'}`}>
                {collectionName && documentCount !== undefined 
                  ? `${documentCount} document${documentCount !== 1 ? 's' : ''}`
                  : collectionName 
                    ? `${documents.length - 1} document${documents.length - 1 !== 1 ? 's' : ''}`
                    : `${documents.length} document${documents.length !== 1 ? 's' : ''}`
                }
              </div>
            </div>
          </div>

          {/* Animated accent line */}
          <div 
            className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
              currentBrand.name === 'habitaware-ai' 
                ? 'from-[#D448AA] via-[#00A99D] to-[#D448AA]' 
                : 'from-blue-500 via-purple-500 to-blue-500'
            }`}
          />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && <motion.div initial={{
          opacity: 0,
          y: -10,
          scale: 0.95
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} exit={{
          opacity: 0,
          y: -10,
          scale: 0.95
        }} transition={{
          duration: 0.2
        }} className="absolute top-full left-0 right-0 mt-2 z-50">
              <div className={`rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden ${
                currentBrand.name === 'habitaware-ai' ? 'bg-white/95 border-slate-200' : 'bg-slate-800/95 border-slate-700/50'
              }`}>
                <div className="p-2 space-y-1">
                  {documents.map((doc, index) => {
                const isSelected = doc.id === selectedId;
                return <motion.button key={doc.id} onClick={() => {
                  onSelect(doc.id);
                  setIsOpen(false);
                }} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: index * 0.05
                }} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${
                  isSelected 
                    ? currentBrand.name === 'habitaware-ai' 
                      ? 'bg-[#D448AA]/10 border border-[#D448AA]/20' 
                      : 'bg-blue-500/20 border border-blue-500/40' 
                    : currentBrand.name === 'habitaware-ai'
                      ? 'hover:bg-slate-50 border border-transparent'
                      : 'hover:bg-slate-700/50 border border-transparent'
                }`} whileHover={{
                  x: 4
                }}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500/30' : 'bg-slate-700/50'}`}>
                          <FileTextIcon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {doc.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {doc.pageCount} pages
                          </p>
                        </div>

                        {isSelected && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    currentBrand.name === 'habitaware-ai' ? 'bg-[#D448AA]' : 'bg-blue-500'
                  }`}>
                            <CheckIcon className="w-3 h-3 text-white" />
                          </motion.div>}
                      </motion.button>;
              })}
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>
      </motion.div>

      {/* Info note */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.3
    }} className={`mt-6 p-4 rounded-xl border ${
        currentBrand.name === 'habitaware-ai' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/30 border-slate-700/30'
      }`}>
        <p className={`text-xs leading-relaxed ${currentBrand.name === 'habitaware-ai' ? 'text-slate-600' : 'text-slate-400'}`}>
          <span className={`${currentBrand.name === 'habitaware-ai' ? 'text-[#D448AA]' : 'text-blue-400'} font-medium`}>Note:</span> The
          "Speaking" toggle controls visual animations only. {currentBrand.displayName} doesn't
          actually speak aloud—it's a visual indicator to show when the AI is
          responding.
        </p>
      </motion.div>
    </div>;
}