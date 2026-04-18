import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../api';
import { useStore } from '../store/useStore';

export const ChatPage = () => {
  const { chatHistory, addMessage } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'student', content: input };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    const context = { topic: 'General Astrophysics', level: 2, recentScores: [85, 90] };
    const res = await api.chatMessage(userMsg.content, context, chatHistory);
    
    addMessage({ role: 'tutor', content: res.reply });
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-12 w-full h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Intelligent Tutor Chat</h1>
        <p className="text-on-surface-variant">Your AI mentor is here 24/7 to deconstruct complex theories into simple cosmic analogies.</p>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 bg-surface-container-low/50"
        >
          {chatHistory.length === 0 && (
            <div className="text-center text-on-surface-variant py-12">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">forum</span>
              <p>Start a conversation. Ask about any topic you're struggling with.</p>
            </div>
          )}
          
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 text-sm ${
                msg.role === 'student' 
                  ? 'bg-primary-container text-white rounded-2xl rounded-tr-none shadow-lg' 
                  : 'bg-surface-container-high text-on-surface-variant rounded-2xl rounded-tl-none border border-outline-variant/10'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high rounded-2xl rounded-tl-none p-4 border border-outline-variant/10 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ffb873]"></div>
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ffb873]" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ffb873]" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-surface-container border-t border-outline-variant/10">
          <form onSubmit={handleSend} className="relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your tutor anything..." 
              className="pr-16"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 top-2.5 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary disabled:opacity-50 transition-opacity"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};
