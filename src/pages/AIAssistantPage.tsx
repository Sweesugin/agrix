import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  User as UserIcon,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Leaf,
  Droplets,
  Sprout,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  disclaimer?: string;
}

const QUICK_PROMPTS = [
  'How can I reduce water usage on my farm?',
  'What sustainable practices are suitable for my crop?',
  'How can I improve soil health naturally?',
  'What is crop rotation and how do I schedule it?',
  'How can I control sucking pests using neem oil?',
];

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Namaste ${user ? user.name : 'Farmer'}! 🙏 I am your **AgriX AI Agricultural Assistant**.
      
I'm here to help you discover simple, low-cost sustainable farming practices—like organic mulching, drip irrigation, biological pest sprays, and vermicomposting.

I have your farm profile context:
- **Main Crop:** ${user?.mainCrop || 'Vegetables'}
- **Soil Type:** ${user?.soilType || 'Loamy'}
- **Farming Approach:** ${user?.farmingMethod || 'Mixed'}
- **Location:** ${user?.location || 'India'} (${user?.farmSize || 3} acres)

How can I assist your field today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      // Build history for API
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await api.askAI(text.trim(), history);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        disclaimer: res.disclaimer,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: 'I apologize, but I had trouble connecting to the agricultural advisory model. Please check your network or try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        text: `Chat reset. Ask me any question regarding your ${user?.mainCrop || 'crops'} and ${user?.soilType || 'soil'}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              AgriX AI Assistant
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            AI-assisted sustainable agronomy guidance powered by Gemini 3.8 Flash, grounded with your personalized farm profile parameters.
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      {/* Safety & Scientific Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mandatory Verification Notice:</strong> AgriX AI Assistant is an educational prototype. Agricultural recommendations do not guarantee harvest outcomes. For severe crop pests, chemical dosages, soil pathogens, or financial decisions, please consult a qualified agricultural extension officer (KVK) or certified agronomist.
        </p>
      </div>

      {/* FARMER PROFILE CONTEXT CHIP */}
      {user && (
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span className="font-bold">Active Farm Context:</span>
            <span>
              {user.mainCrop} on {user.soilType} ({user.farmSize} acres) • {user.farmingMethod}
            </span>
          </div>
          <span className="text-[11px] bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Grounded Mode Active
          </span>
        </div>
      )}

      {/* CHAT CONTAINER */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {!isUser && msg.disclaimer && (
                    <div className="pt-2 mt-2 border-t border-stone-200/60 text-[10px] text-stone-400 italic">
                      {msg.disclaimer}
                    </div>
                  )}

                  <div
                    className={`text-[9px] text-right mt-1 ${
                      isUser ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-stone-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium ml-1">Analyzing sustainable agricultural advice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              disabled={isSending}
              className="text-[11px] px-3 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-full font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-stone-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Ask about water saving, pest control, composting, soil health..."
            className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <span>Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
