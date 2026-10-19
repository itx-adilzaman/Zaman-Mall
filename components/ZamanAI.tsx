
import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Loader2, MessageSquare, Zap, Minimize2, Maximize2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { getShoppingAssistantResponse } from '../services/gemini';
import { useIsMobile } from '../hooks/useIsMobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ZamanAI: React.FC = () => {
  const { products, isAiOpen, setIsAiOpen } = useStore();
  const isMobile = useIsMobile();
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to the Zaman Sons Executive Suite. I am Zaman AI, your personal curator. How may I assist your acquisition strategy today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await getShoppingAssistantResponse(userMessage, products);
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I am experiencing a temporary sync issue with the terminal. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAiOpen) {
    return (
      <button
        onClick={() => setIsAiOpen(true)}
        className={`fixed z-[100] group flex items-center gap-4 animate-fade-in ${
          isMobile
            ? 'bottom-[72px] right-3'   /* above bottom nav on mobile */
            : 'bottom-12 right-2'
        }`}
      >
        {/* Desktop label */}
        <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 hidden md:block">
          Consult Curator
        </div>

        {/* Button — smaller on mobile */}
        {isMobile ? (
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_8px_24px_rgba(37,99,235,0.5)] active:scale-95 transition-all duration-300 border border-white/20 relative">
            <Bot size={18} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#010409] animate-pulse"></div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-[0_20px_50px_rgba(37,99,235,0.5)] hover:scale-110 active:scale-95 transition-all duration-500 border border-white/20 relative">
            <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#010409] animate-pulse"></div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed z-[100] transition-all duration-700 ease-out animate-fade-in ${
      isMobile
        ? 'bottom-[60px] right-0 left-0 mx-2'
        : 'bottom-12 right-10 w-[calc(100vw-4rem)] md:w-[450px]'
    } ${isMinimized ? 'h-[80px]' : isMobile ? 'h-[75vh]' : 'h-[600px] max-h-[80vh]'}`}>
      <div className="bg-black/90 backdrop-blur-3xl h-full flex flex-col rounded-[2.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Zaman AI</h3>
              <div className="flex items-center gap-2 text-[9px] text-blue-400 font-black uppercase tracking-widest">
                <Zap size={10} className="fill-current animate-pulse" /> Executive Curator
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-gray-500 hover:text-white transition-colors">
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button onClick={() => setIsAiOpen(false)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/20' 
                      : 'bg-white/5 border border-white/5 text-gray-300 rounded-tl-none font-medium'
                  }`}>
                    {msg.content}
                    <div className={`text-[8px] mt-2 opacity-40 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/5 border border-white/5 p-5 rounded-[2rem] rounded-tl-none">
                    <Loader2 size={18} className="text-blue-500 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
              <form onSubmit={handleSend} className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inquire about collections..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-gray-700 text-white"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
