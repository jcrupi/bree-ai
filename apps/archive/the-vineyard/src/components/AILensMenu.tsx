import React, { useEffect, useState, useRef } from 'react';
import { AI_LENSES } from '../data/aiLenses';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronUp, GripHorizontal } from 'lucide-react';
interface AILensMenuProps {
  onDragStart: (e: React.DragEvent, lensId: string) => void;
}
// Custom geometric SVG icons for each lens (Unchanged)
function LensIcon({ lensId, size = 28 }: {lensId: string;size?: number;}) {
  const s = size;
  const c = s / 2;
  switch (lensId) {
    case 'urgent-lens':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <circle
            cx={c}
            cy={c}
            r={c - 2}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
            strokeDasharray="2 3" />

          <circle
            cx={c}
            cy={c}
            r={c - 5}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.3" />

          <path
            d={`M${c} 4 L${s - 5} ${c} L${c} ${s - 4} L5 ${c} Z`}
            fill="currentColor"
            opacity="0.12" />

          <path
            d={`M${c} 4 L${s - 5} ${c} L${c} ${s - 4} L5 ${c} Z`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.8" />

          <line
            x1={c}
            y1="8"
            x2={c}
            y2="15"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9" />

          <circle cx={c} cy="19" r="1.5" fill="currentColor" opacity="0.9" />
        </svg>);

    case 'risk-scanner':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <circle
            cx={c}
            cy={c}
            r={c - 3}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.4" />

          <circle
            cx={c}
            cy={c}
            r={c - 7}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.7" />

          <circle cx={c} cy={c} r={3} fill="currentColor" opacity="0.9" />
          <line
            x1={c}
            y1="2"
            x2={c}
            y2={s - 2}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.3" />

          <line
            x1="2"
            y1={c}
            x2={s - 2}
            y2={c}
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.3" />

        </svg>);

    case 'progress-analyst':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <rect
            x="3"
            y="18"
            width="4"
            height="7"
            rx="1"
            fill="currentColor"
            opacity="0.3" />

          <rect
            x="9"
            y="13"
            width="4"
            height="12"
            rx="1"
            fill="currentColor"
            opacity="0.5" />

          <rect
            x="15"
            y="8"
            width="4"
            height="17"
            rx="1"
            fill="currentColor"
            opacity="0.7" />

          <rect
            x="21"
            y="4"
            width="4"
            height="21"
            rx="1"
            fill="currentColor"
            opacity="0.9" />

          <path
            d="M3 20 Q10 14 15 12 T25 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6" />

        </svg>);

    case 'idea-generator':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <circle cx={c} cy={c} r="4" fill="currentColor" opacity="0.9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = angle * Math.PI / 180;
            const innerR = 6;
            const outerR = i % 2 === 0 ? 12 : 9;
            return (
              <line
                key={angle}
                x1={c + Math.cos(rad) * innerR}
                y1={c + Math.sin(rad) * innerR}
                x2={c + Math.cos(rad) * outerR}
                y2={c + Math.sin(rad) * outerR}
                stroke="currentColor"
                strokeWidth={i % 2 === 0 ? '2' : '1.5'}
                strokeLinecap="round"
                opacity={i % 2 === 0 ? 0.9 : 0.5} />);


          })}
        </svg>);

    case 'security-auditor':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <path
            d={`M${c} 2 L${s - 3} 8 L${s - 3} 18 L${c} ${s - 2} L3 18 L3 8 Z`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.7" />

          <path
            d={`M${c} 7 L${s - 7} 11 L${s - 7} 18 L${c} ${s - 6} L7 18 L7 11 Z`}
            fill="currentColor"
            opacity="0.15" />

          <path
            d={`M${c - 3} ${c} L${c} ${c + 4} L${c + 5} ${c - 2}`}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9" />

        </svg>);

    case 'priority-optimizer':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <path
            d="M16 2 L8 15 H15 L12 26 L22 12 H15 Z"
            fill="currentColor"
            opacity="0.15" />

          <path
            d="M16 2 L8 15 H15 L12 26 L22 12 H15 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.9" />

          <circle cx="8" cy="6" r="1.5" fill="currentColor" opacity="0.4" />
          <circle cx="22" cy="22" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>);

    default:
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          <circle
            cx={c}
            cy={c}
            r={c - 4}
            stroke="currentColor"
            strokeWidth="1.5" />

        </svg>);

  }
}
const lensColors: Record<
  string,
  {
    bg: string;
    text: string;
    glow: string;
    border: string;
    ring: string;
  }> =
{
  'urgent-lens': {
    bg: 'bg-orange-950/80',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/20',
    border: 'border-orange-500/20',
    ring: 'ring-orange-400/30'
  },
  'risk-scanner': {
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    glow: 'shadow-rose-500/20',
    border: 'border-rose-500/20',
    ring: 'ring-rose-400/30'
  },
  'progress-analyst': {
    bg: 'bg-sky-950/80',
    text: 'text-sky-300',
    glow: 'shadow-sky-500/20',
    border: 'border-sky-500/20',
    ring: 'ring-sky-400/30'
  },
  'idea-generator': {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/30'
  },
  'security-auditor': {
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-400/30'
  },
  'priority-optimizer': {
    bg: 'bg-violet-950/80',
    text: 'text-violet-300',
    glow: 'shadow-violet-500/20',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/30'
  }
};
export function AILensMenu({ onDragStart }: AILensMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Default position roughly centered vertically on the left
  const [position, setPosition] = useState({
    x: 20,
    y: 300
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    menuX: number;
    menuY: number;
  } | null>(null);
  // Initialize position on mount to be safe for SSR/hydration
  useEffect(() => {
    setPosition({
      x: 20,
      y: window.innerHeight / 2 - 20
    });
  }, []);
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking a button inside header (if any)
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      menuX: position.x,
      menuY: position.y
    };
  };
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.menuX + dx,
        y: dragStartRef.current.menuY + dy
      });
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        // Check if it was a click (minimal movement < 5px)
        if (dragStartRef.current) {
          const dist = Math.sqrt(
            Math.pow(e.clientX - dragStartRef.current.mouseX, 2) +
            Math.pow(e.clientY - dragStartRef.current.mouseY, 2)
          );
          if (dist < 5) {
            // It was a click, toggle expand
            setIsExpanded((prev) => !prev);
          }
        }
        dragStartRef.current = null;
      }
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  return (
    <motion.div
      style={{
        left: position.x,
        top: position.y
      }}
      initial={false}
      animate={{
        width: isExpanded ? 180 : 160,
        borderRadius: isExpanded ? 16 : 999
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className="fixed z-40 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">

      {/* Header / Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-10 flex items-center px-3 gap-2 cursor-move select-none hover:bg-white/5 transition-colors ${isExpanded ? 'border-b border-white/5' : ''}`}>

        {isExpanded ?
        <div className="flex items-center gap-2 w-full">
            <GripHorizontal size={14} className="text-white/20" />
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest flex-1">
              AI Lenses
            </span>
            <div className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/70">
              {AI_LENSES.length}
            </div>
          </div> :

        <>
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300">
              <Sparkles size={14} />
            </div>
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest flex-1">
              AI Lenses
            </span>
            <div className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/70">
              {AI_LENSES.length}
            </div>
          </>
        }
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          transition={{
            duration: 0.2
          }}>

            <div className="p-2 space-y-1">
              {AI_LENSES.map((lens, index) => {
              const colors = lensColors[lens.id] || lensColors['risk-scanner'];
              return (
                <motion.div
                  key={lens.id}
                  initial={{
                    opacity: 0,
                    x: -10
                  }}
                  animate={{
                    opacity: 1,
                    x: 0
                  }}
                  transition={{
                    delay: index * 0.03
                  }}
                  draggable
                  onDragStart={(e) =>
                  onDragStart(e as unknown as React.DragEvent, lens.id)
                  }
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors group`}>

                    <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${colors.bg} border ${colors.border} ${colors.text} shadow-sm`}>

                      <LensIcon lensId={lens.id} size={16} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                      {lens.name}
                    </span>
                  </motion.div>);

            })}

              {/* Collapse Button */}
              <button
              onClick={() => setIsExpanded(false)}
              className="w-full mt-1 py-1 flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 rounded transition-colors">

                <ChevronUp size={14} />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

}