import React from 'react';
import { Message } from '../types';
import { User, Cpu, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // System / Tool Output Style
  if (isSystem) {
    return (
      <div className="flex w-full justify-center my-3 animate-fade-in-up">
        <div className="max-w-lg w-full bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-2 flex items-start gap-3 font-mono text-xs text-emerald-400/80 shadow-inner">
          <Terminal size={14} className="mt-0.5 shrink-0 text-emerald-500" />
          <div className="break-all leading-relaxed">
            <span className="opacity-50 mr-2">$</span>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // User & Assistant Style
  return (
    <div className={`flex w-full mb-6 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-lg ${isUser ? 'bg-indigo-600/20' : 'bg-cyan-500/20'}`}>
          {isUser ? <User size={14} className="text-indigo-300" /> : <Cpu size={14} className="text-cyan-300" />}
        </div>

        {/* Message Bubble */}
        <div className={`group relative p-4 rounded-2xl text-sm leading-relaxed shadow-xl border backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${
          isUser 
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-50 rounded-tr-sm hover:border-indigo-500/40' 
            : 'bg-zinc-800/40 border-white/5 text-zinc-100 rounded-tl-sm hover:bg-zinc-800/60'
        }`}>
          {/* Decorative Corner Accent */}
          <div className={`absolute top-0 w-3 h-3 border-t border-current opacity-40 ${isUser ? 'right-0 border-r border-indigo-400' : 'left-0 border-l border-cyan-400'}`}></div>

          {message.content}
          
          {/* Timestamp or Status (Optional, on hover) */}
          <div className="absolute -bottom-5 right-0 text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;