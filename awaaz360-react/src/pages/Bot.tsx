import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Robot, PaperPlaneRight, User, Sparkle, ArrowsClockwise } from '@phosphor-icons/react';
import ChatSuggestions from '../components/ChatSuggestions';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Assalam-o-Alaikum! 👋\n\nMain **AWAAZ360 AI Assistant** hoon. Main aapki madad kar sakta hoon:\n\n• ⚡ Bijli ke masail\n• 💧 Paani ki shikayat\n• 🔥 Gas ke issues\n• 🚑 Emergency numbers\n• ⛽ Fuel prices\n• 🕌 Namaz ke auqaat\n• 🌤️ Mausam ki maloomat\n• 🩸 Blood donor information\n\n**Kya poochna chahenge?**' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [fuelUpdated, setFuelUpdated] = useState('');
  const [fuelSource, setFuelSource] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [prayerData, setPrayerData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getFuelPrices().then(d => { setFuelPrices(d.prices || []); setFuelUpdated(d.updated || ''); setFuelSource(d.source || ''); }).catch(() => {});
    api.getWeather().then(setWeatherData).catch(() => {});
    api.getPrayerTimes().then(setPrayerData).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || sending) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setSending(true);
    try {
      const result = await api.chat({ query, fuelPrices, fuelUpdated, weatherData, prayerData, fuelSource });
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf karein, koi masla aaya. Dobara koshish karein ya dobara likhein.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      { role: 'assistant', content: 'Assalam-o-Alaikum! 👋\n\nMain **AWAAZ360 AI Assistant** hoon. Main aapki madad kar sakta hoon:\n\n• ⚡ Bijli ke masail\n• 💧 Paani ki shikayat\n• 🔥 Gas ke issues\n• 🚑 Emergency numbers\n• ⛽ Fuel prices\n• 🕌 Namaz ke auqaat\n• 🌤️ Mausam ki maloomat\n• 🩸 Blood donor information\n\n**Kya poochna chahenge?**' },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(162,155,254,0.15), rgba(0,229,176,0.15))',
          border: '1px solid rgba(162,155,254,0.25)',
          boxShadow: '0 0 20px rgba(162,155,254,0.15)',
        }}>
          <Robot size={24} weight="duotone" style={{ color: 'var(--color-purple)' }} />
        </span>
        <div className="flex-1">
          <div className="title" style={{
            background: 'linear-gradient(135deg, #a29bfe, #00e5b0, #4fc3f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🤖 AWAAZ360 AI Assistant</div>
          <div className="subtitle">AI-powered civic assistant — aapki madad ke liye 24/7</div>
        </div>
        <button onClick={handleNewChat} className="btn-secondary flex items-center gap-2 text-xs !py-2 !px-3">
          <ArrowsClockwise size={14} weight="bold" /> New Chat
        </button>
      </div>

      <div
        className="card-3d flex flex-col animate-in"
        style={{ height: 'calc(100vh - 240px)', minHeight: 450, padding: 0, overflow: 'hidden' }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: msg.role === 'assistant'
                    ? 'linear-gradient(135deg, rgba(0,229,176,0.2), rgba(79,195,247,0.2))'
                    : 'linear-gradient(135deg, rgba(79,195,247,0.2), rgba(162,155,254,0.2))',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                {msg.role === 'assistant'
                  ? <Robot size={16} weight="duotone" style={{ color: 'var(--color-teal)' }} />
                  : <User size={16} weight="duotone" style={{ color: 'var(--color-sky)' }} />
                }
              </div>

              {/* Message bubble */}
              <div
                className={msg.role === 'user' ? 'chat-user' : 'chat-assistant'}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                <div className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</div>
                <div className="text-[10px] mt-2 opacity-40">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,176,0.2), rgba(79,195,247,0.2))',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <Sparkle size={14} weight="fill" style={{ color: 'var(--color-teal)' }} />
              </div>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {showSuggestions && messages.length <= 2 && (
          <div className="border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
            <div className="px-4 pt-3 pb-1 text-xs" style={{ color: 'var(--color-fg2)' }}>
              💡 Suggested questions:
            </div>
            <ChatSuggestions onSelect={(q) => handleSend(q)} />
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Apna sawal yahan likhein..."
                className="!pr-12"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="btn !p-3 !rounded-xl"
            >
              <PaperPlaneRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
