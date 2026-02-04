import React from 'react';
import { motion } from 'framer-motion';

interface SpeakingAvatarProps {
  isSpeaking: boolean;
  imageUrl: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SpeakingAvatar({ isSpeaking, imageUrl, alt, size = 'md' }: SpeakingAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48'
  };

  return (
    <div className="relative">
      <motion.div
        animate={isSpeaking ? {
          scale: [1, 1.05, 1],
          borderColor: [
            `${currentBrand.colors.primary}33`, 
            `${currentBrand.colors.primary}CC`, 
            `${currentBrand.colors.primary}33`
          ]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`${sizeClasses[size]} rounded-full border-2 border-slate-800 overflow-hidden shadow-2xl bg-white p-4`}
      >
        <img src={imageUrl} alt={alt} className="w-full h-full object-contain" />
      </motion.div>
      
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
              className="absolute inset-0 border-2 rounded-full"
              style={{ borderColor: currentBrand.colors.primary }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
