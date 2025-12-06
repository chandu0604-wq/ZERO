import React from 'react';
import { NovaState } from '../types';

interface NovaOrbProps {
  state: NovaState;
}

const NovaOrb: React.FC<NovaOrbProps> = ({ state }) => {
  
  // Dynamic color resolution
  const getColors = () => {
    switch (state) {
      case NovaState.LISTENING: return 'text-cyan-400 shadow-cyan-500/50 from-cyan-400 to-blue-500';
      case NovaState.THINKING: return 'text-fuchsia-500 shadow-fuchsia-500/50 from-fuchsia-500 to-purple-600';
      case NovaState.SPEAKING: return 'text-emerald-400 shadow-emerald-500/50 from-emerald-400 to-teal-500';
      case NovaState.EXECUTING: return 'text-amber-500 shadow-amber-500/50 from-amber-400 to-orange-600';
      case NovaState.IDLE: default: return 'text-blue-500 shadow-blue-500/30 from-blue-600 to-indigo-700';
    }
  };

  const getGlowColor = () => {
      switch (state) {
          case NovaState.LISTENING: return 'bg-cyan-500';
          case NovaState.THINKING: return 'bg-fuchsia-500';
          case NovaState.SPEAKING: return 'bg-emerald-500';
          case NovaState.EXECUTING: return 'bg-amber-500';
          default: return 'bg-blue-500';
      }
  };

  const isIdle = state === NovaState.IDLE;
  const isListening = state === NovaState.LISTENING;
  const isThinking = state === NovaState.THINKING;
  const isSpeaking = state === NovaState.SPEAKING;
  const isExecuting = state === NovaState.EXECUTING;

  return (
    <div className="relative flex items-center justify-center w-96 h-96">
        
        {/* --- BASE LAYERS --- */}

        {/* 1. Ambient Backdrop Glow (Large) */}
        <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 ease-in-out ${getGlowColor()} ${isSpeaking || isThinking ? 'opacity-30 scale-110' : 'opacity-20 scale-100'}`}></div>

        {/* 2. Primary Outer Ring (Slow Rotation) */}
        <div className={`absolute w-[22rem] h-[22rem] rounded-full border border-white/5 border-dashed transition-all duration-1000 ease-in-out
            ${isThinking ? 'animate-spin-reverse-slow opacity-60 border-white/20' : 'animate-spin-slow opacity-30'}
        `}></div>

        {/* --- STATE SPECIFIC LAYERS (Opacity Transitions) --- */}

        {/* IDLE: Gentle breathing ring */}
        <div className={`absolute w-64 h-64 rounded-full border border-blue-500/20 animate-pulse-slow transition-all duration-700
            ${isIdle ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
        `}></div>

        {/* LISTENING: Ripple/Sonar effect */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
             <div className="absolute w-60 h-60 rounded-full border border-cyan-500/30 animate-ping-slow"></div>
             <div className="absolute w-52 h-52 rounded-full border border-cyan-400/20 animate-ping-slow animation-delay-500"></div>
        </div>

        {/* THINKING: Fast spins & Particles */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isThinking ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            {/* Fast inner spinner */}
            <div className="absolute w-64 h-64 rounded-full border-t-2 border-r-2 border-fuchsia-500/50 border-transparent animate-spin"></div>
            <div className="absolute w-56 h-56 rounded-full border-b-2 border-l-2 border-purple-500/50 border-transparent animate-spin-reverse-slow"></div>
        </div>

        {/* EXECUTING: Mechanical locking rings */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isExecuting ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
            <div className="absolute w-72 h-72 rounded-full border-[1px] border-dashed border-amber-500/30 animate-spin-slow"></div>
            <div className="absolute w-60 h-60 rounded-full border-2 border-t-amber-500/60 border-b-amber-500/10 border-l-transparent border-r-transparent animate-spin-fast"></div>
            <div className="absolute w-48 h-48 rounded-full border-2 border-r-amber-500/60 border-l-amber-500/10 border-t-transparent border-b-transparent animate-spin-reverse-slow"></div>
        </div>

        {/* SPEAKING: Audio Wave Simulation */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 animate-pulse-rapid"></div>
            <div className="absolute w-64 h-64 rounded-full border border-emerald-500/30 animate-ping-slow"></div>
        </div>

        {/* --- PARTICLES (Active in Thinking/Executing) --- */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isThinking || isExecuting ? 'opacity-100' : 'opacity-0'}`}>
             <div className="absolute w-full h-full animate-spin-slow">
                <div className={`absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor] ${isExecuting ? 'bg-amber-400' : 'bg-fuchsia-400'}`}></div>
             </div>
             <div className="absolute w-full h-full animate-spin-reverse-slow delay-150">
                <div className={`absolute bottom-0 left-1/2 w-1 h-1 rounded-full shadow-[0_0_10px_currentColor] ${isExecuting ? 'bg-orange-400' : 'bg-purple-400'}`}></div>
             </div>
        </div>

        {/* --- CORE SPHERE --- */}
        <div className={`relative z-10 w-32 h-32 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${isSpeaking ? 'scale-110 border-white/20' : 'scale-100'}
            ${isThinking ? 'scale-95' : ''}
        `}>
            
            {/* Core Gradient */}
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getColors().split(' ').slice(2).join(' ')} opacity-60 blur-md transition-all duration-700
                 ${isSpeaking ? 'animate-pulse-rapid scale-110 opacity-80' : 'animate-pulse-slow'}
                 ${isThinking ? 'animate-pulse-fast scale-90' : ''}
                 ${isExecuting ? 'animate-pulse-fast' : ''}
            `}></div>
            
            {/* Inner White Core (The "Eye") */}
            <div className={`absolute w-12 h-12 rounded-full bg-white blur-xl transition-all duration-500 ease-in-out
                ${isSpeaking ? 'opacity-60 scale-125' : 'opacity-30 scale-100'}
                ${isThinking ? 'opacity-50 scale-75' : ''}
                ${isExecuting ? 'opacity-70 scale-50' : ''}
            `}></div>

            {/* Label */}
            <div className="absolute z-20 text-[10px] font-mono tracking-[0.3em] text-white/90 font-bold mix-blend-overlay animate-float">
                ZERO
            </div>
        </div>
        
        {/* Status Text Label */}
        <div className="absolute -bottom-12 flex flex-col items-center animate-fade-in-up">
            <span className={`text-[10px] uppercase tracking-[0.4em] font-mono font-bold transition-colors duration-500 ${getColors().split(' ')[0]}`}>
                {state}
            </span>
            <div className="flex gap-1.5 mt-3">
                 {[0,1,2].map(i => (
                     <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${getGlowColor().replace('bg-', 'bg-')} 
                        ${isThinking ? 'animate-bounce' : 'opacity-40'}
                     `} style={{ animationDelay: `${i * 100}ms` }}></div>
                 ))}
            </div>
        </div>

    </div>
  );
};

export default NovaOrb;