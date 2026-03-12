import React from 'react';
import { motion } from 'framer-motion';
import { BoxIcon } from 'lucide-react';
interface ArchitectureNodeProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: BoxIcon;
  tech?: string[];
  port?: string;
  color: 'blue' | 'green' | 'amber' | 'violet' | 'rose';
  delay?: number;
}
const colorStyles = {
  blue: {
    border: 'border-blue-100',
    glow: 'group-hover:shadow-blue-100/50',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    gradient: 'from-blue-50/50',
    tagBg: 'bg-blue-50',
    tagText: 'text-blue-600',
    tagBorder: 'border-blue-100'
  },
  green: {
    border: 'border-emerald-100',
    glow: 'group-hover:shadow-emerald-100/50',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    gradient: 'from-emerald-50/50',
    tagBg: 'bg-emerald-50',
    tagText: 'text-emerald-600',
    tagBorder: 'border-emerald-100'
  },
  amber: {
    border: 'border-amber-100',
    glow: 'group-hover:shadow-amber-100/50',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    gradient: 'from-amber-50/50',
    tagBg: 'bg-amber-50',
    tagText: 'text-amber-600',
    tagBorder: 'border-amber-100'
  },
  violet: {
    border: 'border-violet-100',
    glow: 'group-hover:shadow-violet-100/50',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    gradient: 'from-violet-50/50',
    tagBg: 'bg-violet-50',
    tagText: 'text-violet-600',
    tagBorder: 'border-violet-100'
  },
  rose: {
    border: 'border-rose-100',
    glow: 'group-hover:shadow-rose-100/50',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    gradient: 'from-rose-50/50',
    tagBg: 'bg-rose-50',
    tagText: 'text-rose-600',
    tagBorder: 'border-rose-100'
  }
};
export function ArchitectureNode({
  title,
  subtitle,
  description,
  icon: Icon,
  tech,
  port,
  color,
  delay = 0
}: ArchitectureNodeProps) {
  const style = colorStyles[color];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        delay,
        duration: 0.4
      }}
      whileHover={{
        scale: 1.02
      }}
      className={`group relative p-6 rounded-2xl bg-white border ${style.border} hover:shadow-xl hover:border-opacity-100 transition-all duration-300 ${style.glow} flex flex-col h-full`}>

      {/* Background Gradient */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${style.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />


      <div className="relative flex items-start justify-between mb-4">
        <div
          className={`p-2.5 rounded-xl ${style.iconBg} ${style.iconColor} shadow-sm`}>

          <Icon size={24} />
        </div>
        {port &&
        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            :{port}
          </span>
        }
      </div>

      <div className="relative mb-4">
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors mb-1">
          {title}
        </h3>
        {subtitle &&
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {subtitle}
          </p>
        }
        {description &&
        <p className="text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        }
      </div>

      <div className="relative mt-auto pt-4 flex flex-wrap gap-2">
        {tech?.map((t) =>
        <span
          key={t}
          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md border ${style.tagBg} ${style.tagText} ${style.tagBorder}`}>

            {t}
          </span>
        )}
      </div>
    </motion.div>);

}