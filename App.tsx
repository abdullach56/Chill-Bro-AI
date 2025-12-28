
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiClient, SYSTEM_INSTRUCTION, TOOLS } from './services/geminiService';
import { ChatMessage, MessageRole, ToolAction, User, AISettings, ChatSession } from './types';
import ChatBubble from './components/ChatBubble';
import ActionPanel from './components/ActionPanel';
import Modal from './components/Modal';
import AuthModal from './components/AuthModal';
import HistoryModal from './components/HistoryModal';
import { 
  Send, 
  Terminal, 
  History as HistoryIcon, 
  Settings,
  Mail,
  MessageSquare,
  ChevronRight,
  Trash2,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeft,
  Reply,
  Inbox,
  Sparkles,
  Instagram,
  Youtube,
  GraduationCap,
  Smile,
  Plus,
  Search
} from 'lucide-react';
import { Modality, LiveServerMessage } from '@google/genai';

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [actions, setActions] = useState<ToolAction[]>([]);
  
  // Voice state
  const [isLiveActive, setIsLiveActive] = useState(false);
  const sessionRef = useRef<any>(null);
  const outCtxRef = useRef<AudioContext | null>(null);
  const inCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Storage
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chillbro_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('chillbro_settings');
    return saved ? JSON.parse(saved) : { persona: 'Creative', customInstruction: '' };
  });
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chillbro_history');
    return saved ? JSON.parse(saved) : [];
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: MessageRole.MODEL,
        content: `Yo ${user ? user.username : 'Bhai'}! Tera Chill Bro AI haazir hai! 🚀\n\nNotes chahiye, Insta caption, ya bas chill karna hai? Bata, tera bhai sab set kar dega!`,
        timestamp: Date.now()
      }]);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chillbro_user', JSON.stringify(user));
    localStorage.setItem('chillbro_settings', JSON.stringify(aiSettings));
    localStorage.setItem('chillbro_history', JSON.stringify(chatSessions));
  }, [user, aiSettings, chatSessions]);

  const startNewChat = (archiveCurrent: boolean = true) => {
    if (archiveCurrent && messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === MessageRole.USER)?.content || 'Chill Chat';
      const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;
      
      const newSession: ChatSession = {
        id: Math.random().toString(36).substring(2, 9),
        title: title,
        messages: [...messages],
        timestamp: Date.now()
      };
      
      setChatSessions(prev => [newSession, ...prev]);
    }
    setMessages([]);
    setActions([]);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const msgText = textOverride || input;
    if (!msgText.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: MessageRole.USER, content: msgText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const personaPrompt = `Bro Persona: ${aiSettings.persona}. ${aiSettings.customInstruction}`;
      const history = messages.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.content }] }));

      const requestBody = {
        model: 'gemini-3-flash-preview',
        contents: history,
        config: { systemInstruction: SYSTEM_INSTRUCTION + "\n" + personaPrompt, tools: TOOLS }
      };

      const raw = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const res: any = await raw.json();

      // Handle function calls if any
      if (res.functionCalls && res.functionCalls.length > 0) {
        for (const call of res.functionCalls) {
          const args = call.args as any;
          const actionId = Math.random().toString(36).substr(2, 9);
          const newAction: ToolAction = { id: actionId, name: call.name, args: args, status: 'pending', timestamp: Date.now() };
          setActions(prev => [newAction, ...prev]);

          setTimeout(() => {
            setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'completed' } : a));
            if (call.name === 'send_email') {
              window.location.href = `mailto:${args.to}?subject=${encodeURIComponent(args.subject)}&body=${encodeURIComponent(args.body)}`;
            } else if (call.name === 'send_whatsapp_message') {
              const num = (args.target || '').replace(/\D/g, '');
              if (num.length >= 10) window.open(`https://wa.me/${num}?text=${encodeURIComponent(args.message || '')}`, '_blank');
            }
          }, 800);

          const feedback = call.name === 'send_email' 
            ? `📨 **Email Sorted!** Notes bhej raha hoon to **${args.to}**. Check kar le!`
            : `📲 **WhatsApp Check!** Message ready for **${args.target}**. Opening WhatsApp...`;

          setMessages(prev => [...prev, { role: MessageRole.MODEL, content: feedback, timestamp: Date.now(), isAction: true }]);
        }
      }

      // Handle grounding sources
      const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      const textPart = res.candidates?.[0]?.content?.parts?.find(p => p.text);
      if (textPart && textPart.text) {
        setMessages(prev => [...prev, { 
          role: MessageRole.MODEL, 
          content: textPart.text!, 
          timestamp: Date.now(),
          sources: sources.length > 0 ? sources : undefined
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: MessageRole.MODEL, content: "Bhai, network issue hai shayad. Ek baar fir try kar!", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startLiveVoice = async () => {
    if (isLiveActive) {
      if (sessionRef.current) sessionRef.current.close();
      setIsLiveActive(false);
      return;
    }

    try {
      const ai = getGeminiClient();
      if (!outCtxRef.current) outCtxRef.current = new AudioContext({ sampleRate: 24000 });
      if (!inCtxRef.current) inCtxRef.current = new AudioContext({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const src = inCtxRef.current!.createMediaStreamSource(stream);
            const proc = inCtxRef.current!.createScriptProcessor(4096, 1, 1);
            proc.onaudioprocess = (e) => {
              const data = e.inputBuffer.getChannelData(0);
              const i16 = new Int16Array(data.length);
              for (let i = 0; i < data.length; i++) i16[i] = data[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(i16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            src.connect(proc);
            proc.connect(inCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const b64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (b64 && outCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtxRef.current.currentTime);
              const buf = await decodeAudioData(decode(b64), outCtxRef.current, 24000, 1);
              const s = outCtxRef.current.createBufferSource();
              s.buffer = buf;
              s.connect(outCtxRef.current.destination);
              s.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buf.duration;
              sourcesRef.current.add(s);
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: () => setIsLiveActive(false)
        },
        config: { 
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;
      setMessages(prev => [...prev, { role: MessageRole.MODEL, content: "*Bhai is listening...* Bol, kya help chahiye?", timestamp: Date.now() }]);
    } catch (e) {
      setIsLiveActive(false);
    }
  };

  const applyTemplate = (tmpl: string) => {
    setInput(tmpl);
    inputRef.current?.focus();
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSelectHistory = (session: ChatSession) => {
    setMessages(session.messages);
    setActions([]);
  };

  const handleDeleteHistory = (id: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-200">
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[60] bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'}`}>
        <div className="flex flex-col h-full w-72">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg shadow-violet-500/30">
                <Smile className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tighter uppercase italic">Chill Bro</h1>
                <p className="text-[10px] text-violet-400 font-mono tracking-widest uppercase font-bold">Search Ready 🌐</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
            <button 
              onClick={() => startNewChat(true)}
              className="w-full flex items-center gap-3 px-4 py-3 mb-4 text-sm font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 rounded-xl transition-all active:scale-95"
            >
              <Plus size={18} />
              <span>Naya Chat (Save)</span>
            </button>

            <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Bro's Modes</h3>
            <button onClick={() => applyTemplate("Bhai, search karke bata, recent scene kya hai about - ")} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-blue-500/30">
              <Search size={18} className="text-slate-400 group-hover:text-blue-400" />
              <span className="font-medium">Live Search</span>
            </button>
            <button onClick={() => applyTemplate("Study Mode: Bhai, ye concept easy language mein samjha de - ")} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-violet-500/30">
              <GraduationCap size={18} className="text-slate-400 group-hover:text-violet-400" />
              <span className="font-medium">Study Help</span>
            </button>
            <button onClick={() => applyTemplate("Insta Mode: Trending reel ideas for today - ")} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-pink-500/30">
              <Instagram size={18} className="text-slate-400 group-hover:text-pink-400" />
              <span className="font-medium">Insta Trends</span>
            </button>
            <button onClick={() => applyTemplate("YouTube Mode: Search for cool video ideas about - ")} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-red-500/30">
              <Youtube size={18} className="text-slate-400 group-hover:text-red-400" />
              <span className="font-medium">YT Creator</span>
            </button>
            
            <div className="pt-8">
              <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Settings</h3>
              <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 rounded-xl group transition-all">
                <Settings size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium">Bro Tuning</span>
              </button>
            </div>
          </div>

          <button onClick={() => setIsAuthOpen(true)} className="p-4 border-t border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all group">
            <div className="flex items-center gap-3 px-2">
              <div className={`w-8 h-8 rounded-full ${user ? user.avatarColor : 'bg-slate-700'} border border-slate-600 flex items-center justify-center text-[10px] font-bold`}>
                {user ? user.username.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user ? user.username : 'Bhai Ka Profile'}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">{user ? user.email : 'No Sync'}</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white transition-all bg-slate-900 border border-slate-800 rounded-lg shadow-xl">
                <PanelLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-rose-500 animate-pulse' : 'bg-violet-500'} `} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {isLiveActive ? 'Bro is Listening' : 'Search Powered ⚡'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => startNewChat(false)} 
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors bg-slate-900 rounded-lg border border-slate-800" 
              title="Clear"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800" title="History">
              <HistoryIcon size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 relative">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tl-none p-4 flex gap-1.5 shadow-2xl">
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:200ms]" />
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:400ms]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <button 
                  onClick={startLiveVoice} 
                  className={`p-4 rounded-full transition-all shadow-2xl ${isLiveActive ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95'}`}
                  title="Voice Mode"
                >
                  {isLiveActive ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Sparkles size={18} className="text-slate-600 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Bol bhai, kya scene hai? (Search grounding enabled)..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-16 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm shadow-2xl font-medium placeholder-slate-600" disabled={isTyping} />
                  <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 p-2.5 rounded-xl transition-all shadow-lg text-white">
                    <Send size={18} />
                  </button>
                </form>
              </div>
              <p className="text-[10px] text-center mt-3 text-slate-700 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                Chill Bro AI • Search Grounding Active • v1.1 • {aiSettings.persona} Vibes
              </p>
            </div>
          </div>
          
          <aside className="hidden xl:block w-96 border-l border-slate-800 bg-slate-950/50">
            <ActionPanel actions={actions} />
          </aside>
        </main>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onSignUp={setUser} onLogout={() => setUser(null)} />
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={chatSessions} 
        onSelect={handleSelectHistory} 
        onDelete={handleDeleteHistory} 
      />
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Tune Your Bro">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Bhai Ka Nature</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Professional', 'Creative', 'Concise'] as const).map(p => (
                <button key={p} onClick={() => setAiSettings({...aiSettings, persona: p})} className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${aiSettings.persona === p ? 'bg-violet-600 border-violet-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Extra Gyaan (Instructions)</label>
            <textarea value={aiSettings.customInstruction} onChange={(e) => setAiSettings({...aiSettings, customInstruction: e.target.value})} placeholder="Specific rules..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-violet-500 outline-none h-32 resize-none transition-all shadow-inner" />
          </div>
          <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-xl transition-all shadow-2xl uppercase tracking-[0.2em] text-xs">Save Settings</button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
