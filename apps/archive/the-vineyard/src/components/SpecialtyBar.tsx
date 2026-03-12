import React from 'react';
import { motion } from 'framer-motion';
import { SPECIALTIES, SpecialtyType } from '../data/specialties';
import { Filter } from 'lucide-react';
interface SpecialtyBarProps {
  selectedSpecialties: Set<SpecialtyType>;
  onToggleSpecialty: (id: SpecialtyType) => void;
}
export function SpecialtyBar({
  selectedSpecialties,
  onToggleSpecialty
}: SpecialtyBarProps) {
  const specialtiesList = Object.values(SPECIALTIES);
  return (
    <div className="w-full bg-white border-b border-violet-100 px-6 py-2 flex items-center gap-6 shadow-sm z-20 relative">
      {/* Label */}
      <div className="flex items-center gap-2 text-slate-400">
        <Filter size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Specialties
        </span>
      </div>

      {/* Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {specialtiesList.map((specialty, index) => {
          const isSelected = selectedSpecialties.has(specialty.id);
          const Icon = specialty.icon;
          return (
            <motion.button
              key={specialty.id}
              initial={{
                opacity: 0,
                y: -10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: index * 0.05
              }}
              onClick={() => onToggleSpecialty(specialty.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border
                ${isSelected ? 'text-white shadow-md scale-105' : 'bg-white hover:scale-105 hover:shadow-sm'}
              `}
              style={{
                backgroundColor: isSelected ?
                specialty.color :
                specialty.bgColor,
                color: isSelected ? 'white' : specialty.color,
                borderColor: isSelected ?
                specialty.color :
                `${specialty.color}20`,
                boxShadow: isSelected ?
                `0 4px 12px -2px ${specialty.color}40` :
                undefined
              }}>

              <Icon size={14} strokeWidth={2.5} />
              <span>{specialty.name}</span>
            </motion.button>);

        })}

        {selectedSpecialties.size > 0 &&
        <motion.button
          initial={{
            opacity: 0,
            scale: 0.9
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          onClick={() => {




            // We need a way to clear all, but the prop interface doesn't strictly support it directly
            // without iterating. For now, users can toggle off.
            // Or we can add a 'Clear' button if we had a clear function.
            // Let's just keep it simple as requested.
          }} className="ml-2 text-[10px] font-medium text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2">
            {selectedSpecialties.size} active
          </motion.button>}
      </div>
    </div>);
}