import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Camera, Settings, Sparkles, Wifi, Key } from 'lucide-react';
import NovaOrb from './components/NovaOrb';
import ChatMessage from './components/ChatMessage';
import CameraFeed, { CameraHandle } from './components/CameraFeed';
import { Message, NovaState } from './types';
import { GeminiService } from './services/geminiService';
import { toolsRegistry } from './services/tools';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [novaState, setNovaState] = useState<NovaState>(NovaState.IDLE);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastInteraction, setLastInteraction] = useState<{tool: string, time: number} | null>(null);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false); 
  const [isMicEnabled, setIsMicEnabled] = useState(true); // Global Mic Permission Toggle
  const [showSettings, setShowSettings] = useState(false);
  
  const cameraRef = useRef<CameraHandle>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Lazy init service
  const geminiService = useRef(new GeminiService());
  
  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const retryCountRef = useRef(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Voices Asynchronously
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Proactive Suggestions Logic (Context Aware)
  useEffect(() => {
    const updateSuggestions = () => {
        const hour = new Date().getHours();
        let newSuggestions: string[] = [];
        const timeNow = Date.now();
        
        // Base: Time-based context with ZERO persona
        if (hour >= 5 && hour < 12) {
            newSuggestions = ["Execute Morning Protocol", "Scan Priority Comms", "Status Report"];
        } else if (hour >= 12 && hour < 17) {
            newSuggestions = ["Initiate Focus Mode", "Nutritional Analysis", "System Diagnostics"];
        } else if (hour >= 17 && hour < 22) {
            newSuggestions = ["Relaxation Ambiance", "Evening Summary", "Dim Lighting"];
        } else {
            newSuggestions = ["Sleep Protocol", "Security Scan", "Terminate Sessions"];
        }

        // Overlay: Simulated Activity / Context Awareness
        if (lastInteraction && (timeNow - lastInteraction.time < 5 * 60 * 1000)) {
            if (lastInteraction.tool === 'youtube_control' || lastInteraction.tool === 'media_control') {
                newSuggestions[0] = "Skip Track";
                newSuggestions[1] = "Volume Max";
            } else if (lastInteraction.tool === 'open_application' || lastInteraction.tool === 'run_shell_command') {
                newSuggestions[2] = "Close Active Window";
            } else if (lastInteraction.tool === 'web_search') {
                newSuggestions[1] = "Summarize Results";
            } else if (lastInteraction.tool === 'create_folder' || lastInteraction.tool === 'list_directory') {
                newSuggestions[2] = "Open Directory";
            }
        } else {
             // Random initiatives if no recent context
            const activityChance = Math.random();
            if (activityChance > 0.85) {
                newSuggestions[1] = "Engage Visual Sensors"; // Camera
            } else if (activityChance > 0.70) {
                newSuggestions[2] = "System Check";
            }
        }

        setSuggestions(newSuggestions);
    };

    updateSuggestions();
    
    // Refresh suggestions every 1 minute to check context expiry
    const interval = setInterval(updateSuggestions, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastInteraction]);

  // Welcome Message
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'init',
      role: 'assistant',
      content: "ZERO Online. Background services active. Waiting for command.",
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  // Text to Speech (Strict Male Voice Priority)
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; 
      utterance.pitch = 0.9; 
      
      const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      
      // Strict priority for Male voices
      const preferredVoice = availableVoices.find(v => 
        v.name.includes('Google UK English Male') || 
        v.name.includes('Microsoft David') || 
        v.name.includes('Daniel') ||
        v.name.includes('Guy') ||
        v.name.includes('Google US English Male') ||
        (v.name.toLowerCase().includes('male') && v.lang.includes('en'))
      );
      
      if (preferredVoice) {
          utterance.voice = preferredVoice;
      } else {
          // Fallback: Try to avoid known female voices if possible
          const fallback = availableVoices.find(v => 
            !v.name.includes('Zira') && 
            !v.name.includes('Susan') && 
            !v.name.includes('Female') && 
            v.lang.includes('en')
          );
          if (fallback) utterance.voice = fallback;
      }

      utterance.onstart = () => {
        setNovaState(NovaState.SPEAKING);
        isSpeakingRef.current = true;
        if (recognitionRef.current) recognitionRef.current.abort();
      };
      
      utterance.onend = () => {
        setNovaState(NovaState.IDLE);
        isSpeakingRef.current = false;
        // Resume listening if always on
        if (isAlwaysListening && isMicEnabled) {
             try { recognitionRef.current?.start(); } catch(e) {}
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }
  }, [isAlwaysListening, isMicEnabled, voices]);

  // Speech to Text (Native Web API)
  useEffect(() => {
    // If mic is disabled globally, ensure everything is stopped
    if (!isMicEnabled) {
      setIsAlwaysListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (novaState === NovaState.LISTENING) {
        setNovaState(NovaState.IDLE);
      }
      return;
    }

    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // We use auto-restart logic for "always on" feel
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      let shouldRestart = true;

      recognition.onstart = () => {
        retryCountRef.current = 0; 
        if (!isSpeakingRef.current) {
            setNovaState(NovaState.LISTENING);
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setInputValue(interimTranscript);
        }

        if (finalTranscript) {
          setInputValue(finalTranscript);
          handleUserSubmit(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            shouldRestart = false;
            setIsAlwaysListening(false);
            setNovaState(NovaState.IDLE);
            return;
        }

        if (event.error === 'network') {
            retryCountRef.current += 1;
            if (retryCountRef.current > 5) {
                shouldRestart = false;
                setIsAlwaysListening(false);
                setNovaState(NovaState.IDLE);
                return;
            }
            return;
        }
      };

      recognition.onend = () => {
        // Only restart if mic is enabled and always listening
        if (isAlwaysListening && isMicEnabled && shouldRestart && !isSpeakingRef.current) {
            const delay = retryCountRef.current > 0 ? 1000 : 100;
            setTimeout(() => {
                if (novaState !== NovaState.THINKING && !isSpeakingRef.current) {
                    try { recognition.start(); } catch (e) { /* ignore already started */ }
                } else {
                     setNovaState(NovaState.IDLE);
                }
            }, delay);
        } else {
            if (!isSpeakingRef.current && novaState !== NovaState.THINKING) {
                setNovaState(NovaState.IDLE);
            }
        }
      };

      recognitionRef.current = recognition;
      
      if (isAlwaysListening && isMicEnabled && !isSpeakingRef.current) {
         try { recognition.start(); } catch(e) {}
      }

      // Cleanup to prevent ghost listeners
      return () => {
        recognition.abort();
      };
    }
  }, [isAlwaysListening, isMicEnabled]);

  const toggleListening = () => {
    if (!isMicEnabled) return; // Do nothing if mic is globally disabled

    if (isAlwaysListening) {
        setIsAlwaysListening(false);
        recognitionRef.current?.abort(); // Abort is cleaner than stop for immediate off
        setNovaState(NovaState.IDLE);
    } else {
        setIsAlwaysListening(true);
    }
  };

  const toggleMicAccess = () => {
    setIsMicEnabled(prev => !prev);
  };

  const changeApiKey = async () => {
    // Safe access to injected aistudio API
    const win = window as any;
    if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
        try {
            await win.aistudio.openSelectKey();
            setShowSettings(false);
        } catch (e) {
            console.error("Failed to open key selection", e);
        }
    } else {
        alert("API Key management is handled by the hosting environment.");
    }
  };

  // Main Handler
  const handleUserSubmit = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSuggestions([]); 
    setNovaState(NovaState.THINKING);

    recognitionRef.current?.abort();

    let imageBase64: string | undefined = undefined;
    if (isCameraActive && cameraRef.current) {
        const capture = cameraRef.current.capture();
        if (capture) imageBase64 = capture;
    }

    const response = await geminiService.current.generateResponse(text, imageBase64);

    if (response.toolCalls && response.toolCalls.length > 0) {
        setNovaState(NovaState.EXECUTING);
        const toolOutputs: { name: string, response: any }[] = [];

        for (const call of response.toolCalls) {
            setLastInteraction({ tool: call.name, time: Date.now() });

            const toolDef = toolsRegistry.find(t => t.name === call.name);
            if (toolDef) {
                const sysMsg: Message = {
                    id: Date.now().toString() + Math.random(),
                    role: 'system',
                    content: `Executing: ${toolDef.name} >> ${JSON.stringify(call.args)}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, sysMsg]);

                try {
                    const output = await toolDef.execute(call.args);
                    toolOutputs.push({ name: call.name, response: output });
                } catch (err: any) {
                     toolOutputs.push({ name: call.name, response: `Error: ${err.message}` });
                }
            }
        }

        const finalResponseText = await geminiService.current.submitToolOutputs(toolOutputs);
        
        const assistantMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: finalResponseText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        speak(finalResponseText);

    } else {
        const assistantMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        speak(response.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmit(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
      
      {/* 1. Background Layer */}
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Camera Feed */}
      <CameraFeed ref={cameraRef} isActive={isCameraActive} />

      {/* 2. Header (HUD Style) */}
      <header className="flex justify-between items-center px-8 py-6 z-20">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-50 animate-ping"></div>
            </div>
            <div className="flex flex-col">
                <h1 className="font-display font-bold text-2xl tracking-[0.2em] text-white">ZERO</h1>
                <span className="text-[10px] text-cyan-400/60 font-mono tracking-widest uppercase">Autonomous AI System</span>
            </div>
        </div>
        
        <div className="flex items-center gap-6 glass-panel px-4 py-2 rounded-full">
             <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Wifi size={14} className="text-emerald-400" />
                <span>ONLINE</span>
             </div>
             <div className="w-[1px] h-4 bg-white/10"></div>
             
             {/* Header Controls (Quick Access) */}
             <button 
                onClick={toggleMicAccess}
                className={`transition-colors flex items-center gap-2 ${isMicEnabled ? 'text-zinc-600 hover:text-zinc-400' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                title={isMicEnabled ? "Disable Microphone" : "Enable Microphone"}
             >
                {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
             </button>

             <div className="w-[1px] h-4 bg-white/10"></div>

             <button 
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`transition-colors ${isCameraActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="Toggle Camera"
             >
                <Camera size={18} />
             </button>
        </div>
      </header>

      {/* 3. Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Chat Stream */}
        <div className="flex-1 w-full overflow-y-auto px-8 py-4 no-scrollbar fade-mask scroll-smooth">
            <div className="min-h-full flex flex-col justify-end pb-8">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={chatEndRef} />
            </div>
        </div>

        {/* ZERO Visualization */}
        <div className={`transition-all duration-1000 ease-in-out ${messages.length > 0 ? 'scale-75 h-56' : 'scale-100 h-[30rem]'} flex items-center justify-center`}>
           <NovaOrb state={novaState} />
        </div>

        {/* 4. Bottom Command Deck */}
        <div className="w-full px-8 pb-10 pt-4 flex flex-col items-center gap-4">
            
            {/* Suggestions Chips */}
            {suggestions.length > 0 && (
                <div className="flex justify-center gap-3 flex-wrap animate-fade-in-up">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleUserSubmit(s)}
                            className="group flex items-center gap-2 bg-zinc-900/60 hover:bg-cyan-900/20 border border-white/10 hover:border-cyan-500/50 
                                     text-zinc-400 hover:text-cyan-300 text-xs font-mono px-4 py-2 rounded-full transition-all duration-300
                                     backdrop-blur-md hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                        >
                            <Sparkles size={12} className="text-cyan-500 group-hover:animate-spin-slow" />
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Bar */}
            <div className="w-full max-w-3xl relative flex items-center gap-2 glass-panel p-2 rounded-full shadow-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-cyan-500/30 focus-within:bg-black/40">
                
                {/* Settings Menu Trigger */}
                <div className="relative">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-3 rounded-full transition-colors ${showSettings ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400'}`}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    
                    {/* Settings Menu */}
                    {showSettings && (
                        <div className="absolute bottom-full left-0 mb-4 w-64 bg-[#09090b]/95 border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-xl z-50 animate-fade-in-up">
                            <div className="flex flex-col gap-3">
                                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest px-2">System Controls</div>
                                
                                {/* API Key Selection */}
                                <button 
                                    onClick={changeApiKey}
                                    className="flex items-center justify-between px-3 py-3 rounded-xl text-xs font-mono transition-all border bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Key size={16} className="text-amber-500 group-hover:text-amber-400" />
                                        <span className="font-bold">CHANGE API KEY</span>
                                    </div>
                                </button>

                                {/* Mic Toggle */}
                                <button 
                                    onClick={() => { toggleMicAccess(); }}
                                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-mono transition-all border ${isMicEnabled ? 'bg-zinc-800/50 text-zinc-200 border-white/5 hover:bg-zinc-800' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                                        <span className="font-bold">MICROPHONE</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${isMicEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                </button>

                                {/* Camera Toggle */}
                                <button 
                                    onClick={() => { setIsCameraActive(!isCameraActive); }}
                                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-mono transition-all border ${isCameraActive ? 'bg-zinc-800/50 text-zinc-200 border-white/5 hover:bg-zinc-800' : 'bg-zinc-900 text-zinc-500 border-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Camera size={16} />
                                        <span className="font-bold">CAMERA</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-zinc-700'}`}></div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!isMicEnabled ? "Microphone Disabled" : isAlwaysListening ? "Listening..." : "Enter command sequence..."}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 px-2 font-light tracking-wide text-sm"
                />

                <div className="flex items-center gap-2 pr-1">
                    {inputValue.length > 0 ? (
                         <button 
                            onClick={() => handleUserSubmit(inputValue)}
                            className="p-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-900/20 hover:scale-105 active:scale-95"
                        >
                            <Send size={18} className="ml-0.5" />
                        </button>
                    ) : (
                        <button 
                            onClick={toggleListening}
                            disabled={!isMicEnabled}
                            className={`p-3 rounded-full transition-all duration-500 shadow-lg border border-transparent ${
                                !isMicEnabled 
                                ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border-zinc-700/30' 
                                : isAlwaysListening 
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-red-900/20' 
                                    : 'bg-white/5 text-zinc-400 hover:text-cyan-400 hover:bg-white/10'
                            }`}
                            title={!isMicEnabled ? "Microphone Disabled in Settings" : (isAlwaysListening ? "Stop Listening" : "Start Listening")}
                        >
                            {isAlwaysListening ? (
                                <div className="relative">
                                    <Mic size={20} />
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                </div>
                            ) : <MicOff size={20} />}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Status Footer */}
            <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono uppercase tracking-widest opacity-60">
                <span>V.3.1.0</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span className={isMicEnabled ? (isAlwaysListening ? 'text-emerald-500' : 'text-zinc-500') : 'text-red-900'}>
                    {!isMicEnabled ? 'INPUT DISABLED' : (isAlwaysListening ? 'AUDIO INPUT ACTIVE' : 'AUDIO INPUT IDLE')}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span>SECURE</span>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;