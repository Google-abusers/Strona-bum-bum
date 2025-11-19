import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Activity, Shield, Zap, Atom, Move } from 'lucide-react';
import { ChatMessage, SimulationConfig } from '../types';

interface InterfaceOverlayProps {
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isProcessing: boolean;
  config: SimulationConfig;
}

const InterfaceOverlay: React.FC<InterfaceOverlayProps> = ({ 
  chatHistory, 
  onSendMessage, 
  isProcessing,
  config
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = () => {
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 overflow-hidden">
      
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Title */}
        <div className="bg-black/60 backdrop-blur-lg border-l-2 border-t border-b border-r border-cyan-500/50 p-4 clip-path-polygon shadow-[0_0_30px_rgba(6,182,212,0.2)] pointer-events-auto">
          <h1 className="text-3xl font-black font-mono flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white tracking-tighter">
            <Atom className="w-8 h-8 text-cyan-400 animate-spin-slow" />
            NEXUS_PHYSICS
          </h1>
          <div className="text-[10px] font-mono text-cyan-600 mt-1 flex justify-between">
             <span>BUILD.8492</span>
             <span>GPU.ACCELERATED</span>
          </div>
        </div>

        {/* Right: Physics Stats */}
        <div className="flex flex-col gap-2 items-end font-mono text-xs">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-900/60 p-2 rounded min-w-[180px]">
            <div className="flex justify-between text-cyan-400 mb-1">
              <span>GRAVITY_WELL</span>
              <span>{config.gravity.toFixed(2)} G</span>
            </div>
            <div className="w-full h-1 bg-cyan-900/30">
              <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${(config.gravity / 5) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md border border-fuchsia-900/60 p-2 rounded min-w-[180px]">
            <div className="flex justify-between text-fuchsia-400 mb-1">
              <span>ENTROPY</span>
              <span>{(config.chaos * 100).toFixed(0)}%</span>
            </div>
             <div className="w-full h-1 bg-fuchsia-900/30">
              <div className="h-full bg-fuchsia-500 transition-all duration-500" style={{ width: `${config.chaos * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md border border-yellow-900/60 p-2 rounded min-w-[180px]">
            <div className="flex justify-between text-yellow-400">
              <span>PARTICLES</span>
              <span>1600</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Status (Optional) */}
      {config.label !== 'NORMAL' && (
         <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
             <div className="text-red-500 font-mono text-xl font-bold animate-pulse tracking-[0.5em] border-b-2 border-red-500 pb-1">
                 {config.label}
             </div>
         </div>
      )}

      {/* Bottom Layout */}
      <div className="flex flex-col-reverse md:flex-row items-end justify-between gap-4 mt-auto w-full">
        
        {/* Chat Terminal */}
        <div className="w-full md:w-[500px] max-h-[40vh] flex flex-col bg-black/70 backdrop-blur-xl border border-cyan-500/30 rounded-tr-3xl shadow-2xl pointer-events-auto overflow-hidden transition-all duration-300 focus-within:border-cyan-400">
          
          <div className="p-2 bg-gradient-to-r from-cyan-950/50 to-transparent border-b border-cyan-900/50 flex justify-between items-center">
             <span className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-2 px-2">
               <Move className="w-3 h-3" /> COMMAND_LINE
             </span>
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-[200px]">
            {chatHistory.length === 0 && (
               <div className="text-cyan-800 font-mono text-center text-xs mt-8">
                  SYSTEM READY.<br/>
                  Awaiting physics parameters.<br/>
                  Try: "Explode everything", "Create a black hole", "Zero gravity".
               </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[90%] px-3 py-2 rounded text-xs md:text-sm font-mono border ${
                    msg.role === 'user' 
                      ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-50 rounded-br-none' 
                      : 'bg-slate-900/80 border-l-2 border-l-fuchsia-500 border-t-0 border-r-0 border-b-0 text-slate-300'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isProcessing && (
               <div className="text-xs font-mono text-cyan-500 animate-pulse pl-2">
                  > CALCULATING TRAJECTORIES...
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 bg-black/80 border-t border-cyan-900/50 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Input physics command..."
              disabled={isProcessing}
              className="flex-1 bg-transparent text-cyan-100 px-2 font-mono text-sm focus:outline-none placeholder-cyan-900/50"
            />
            <button 
              onClick={handleSend}
              disabled={isProcessing || !inputText.trim()}
              className="text-cyan-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions / Hints */}
        <div className="hidden md:block pointer-events-none text-right mb-8 mr-4">
           <div className="text-cyan-900/40 font-mono text-[10px]">
             MOUSE: INTERACT WITH FIELD<br/>
             AI: CONTROLS LAWS OF PHYSICS<br/>
             RENDER: INSTANCED MESH
           </div>
        </div>

      </div>
    </div>
  );
};

export default InterfaceOverlay;