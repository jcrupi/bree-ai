import React from 'react';
import { Calendar, Users, Target, MoveRight } from 'lucide-react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export function SplashScreen({ onDismiss }: SplashScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#fdfcff] relative overflow-x-hidden font-sans">
      
      {/* Top Navigation Bar Mockup */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6d28d9] flex items-center justify-center transform rotate-12 shadow-md">
            <span className="text-white font-bold tracking-tight text-xl leading-none">C</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 font-serif">crazy-week.</span>
        </div>
        <button className="px-5 py-2 rounded-full bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-medium text-sm transition-colors shadow-sm">
          Login
        </button>
      </nav>

      {/* Floating Hero Image mimicking Fly.io flowing vector banner */}
      <div className="w-[100vw] h-[55vh] max-h-[600px] mt-16 relative flex items-start justify-center overflow-hidden">
        {/* Colorful gradient wash behind the image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f8]/80 via-[#f0f9ff]/80 to-[#f5f3ff]/90 -z-10 blur-xl"></div>
        <img 
          src="/splash_hero.png" 
          alt="Chaos to Flow"
          className="w-full h-full object-cover object-top opacity-95 mix-blend-multiply" 
          style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
        />
      </div>
      
      {/* Huge Serif Header matching "Build fast. Run any code fearlessly." */}
      <div className="relative z-10 w-full max-w-4xl px-6 -mt-16 text-center space-y-6 flex flex-col items-center">
        
        <h1 className="text-6xl md:text-[5.5rem] font-serif font-medium text-slate-900 tracking-tight leading-[1.05]">
          Tame craziness. <br />
          <span className="italic text-[#6d28d9] font-medium relative inline-block">
            Organize fearlessly.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#a78bfa] opacity-60 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 10 Q50 20 100 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="text-xl text-slate-500 max-w-3xl leading-relaxed mt-2 font-light">
          Are you a startup building software? Do you start every week with <span className="font-medium">"This is going to be a crazy week..."</span> and end it with <span className="font-medium">"That was an f-in crazy week"</span>?
        </p>

        {/* The Problem Grid */}
        <div className="grid md:grid-cols-2 gap-6 w-full mt-10 text-left max-w-4xl">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#ffe4e6] text-[#e11d48] rounded-[1rem] flex items-center justify-center mb-6">
              <Calendar size={22} strokeWidth={2} />
            </div>
            <p className="text-[20px] text-[#334155] leading-relaxed">
              Do you start every week with<br />
              <span className="text-[#0f172a] font-bold tracking-tight">"This is going to be a crazy week..."</span>
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 relative top-0 md:top-4">
            <div className="w-12 h-12 bg-[#fef3c7] text-[#d97706] rounded-[1rem] flex items-center justify-center mb-6">
              <Target size={22} strokeWidth={2} />
            </div>
            <p className="text-[20px] text-[#334155] leading-relaxed">
              Do you end every week with<br />
              <span className="text-[#0f172a] font-bold tracking-tight">"That was an f-in crazy week"</span>
            </p>
          </div>
          
          {/* Card 3 (New: Linear/ClickUp) */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#e0e7ff] text-[#4f46e5] rounded-[1rem] flex items-center justify-center mb-6">
              <Users size={22} strokeWidth={2} />
            </div>
            <p className="text-[19px] text-[#334155] leading-relaxed mt-2">
              Why track work in Linear and ClickUp <span className="text-[#4f46e5] font-bold">if management still expects constant reminders?</span>
            </p>
          </div>

          {/* Card 4 (New: Rinse and Repeat) */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 relative top-0 md:top-4">
            <div className="w-12 h-12 bg-[#f1f5f9] text-[#475569] rounded-[1rem] flex items-center justify-center mb-6">
              <RefreshIcon size={22} strokeWidth={2} />
            </div>
            <p className="text-[20px] text-[#334155] leading-relaxed">
              Do you <span className="text-[#0f172a] font-bold">rinse and repeat</span> every Monday?
            </p>
          </div>
        </div>

        {/* Enter CTA */}
        <button 
          onClick={onDismiss}
          className="mt-6 mb-24 bg-[#6d28d9] text-white font-medium px-10 py-4 rounded-full shadow-lg shadow-[#6d28d9]/30 hover:shadow-xl hover:bg-[#5b21b6] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 text-lg"
        >
          Enter the App
          <MoveRight strokeWidth={2.5} className="w-5 h-5 text-indigo-200" />
        </button>

      </div>
    </div>
  );
}

function RefreshIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21v-5h5" />
    </svg>
  );
}
