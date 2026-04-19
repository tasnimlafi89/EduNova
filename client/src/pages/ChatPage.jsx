import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../api';
import { useStore } from '../store/useStore';
import { useQuery } from '@tanstack/react-query';

export const ChatPage = () => {
  const { chatHistory, addMessage } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', 'user-1'],
    queryFn: () => api.getProfile('user-1')
  });

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

    // Build context from real profile data
    const context = {
      topic: profile?.currentRoadmap?.[0]?.replace(/-/g, ' ') || 'General',
      level: profile?.subjects?.[0]?.level || 1,
      recentScores: [],
      studentTopics: profile?.currentRoadmap || []
    };

    const res = await api.chatMessage(userMsg.content, context, chatHistory, 'user-1');
    addMessage({ role: 'tutor', content: res.reply });
    setLoading(false);
  };

  // Quick suggestion chips
  const suggestions = [
    "Explain this concept step by step",
    "Give me a mini quiz",
    "What are my weak areas?",
    "Summarize what I've learned"
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full h-[calc(100vh-64px)] flex flex-col animate-cosmic-fade">
      <div className="mb-6">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">AI Tutor</h1>
        <p className="text-on-surface-variant">Your personal AI mentor — available 24/7 to explain, quiz, and guide you.</p>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-low/30"
        >
          {chatHistory.length === 0 && (
            <div className="text-center py-16 animate-cosmic-fade">
              <span className="material-symbols-outlined text-5xl text-primary mb-4 block opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <p className="text-on-surface-variant mb-6">Start a conversation. I adapt to your level and know your weak areas.</p>
              
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/10 text-on-surface-variant text-xs hover:bg-surface-container-high hover:text-white transition-all hover:scale-105"
                    style={{ animation: `cosmicZoomIn 0.3s ${i * 0.05}s both` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {chatHistory.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `cosmicSlideUp 0.3s ease both` }}
            >
              {msg.role === 'tutor' && (
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
              )}
              <div className={`max-w-[75%] p-4 text-sm leading-relaxed ${
                msg.role === 'student' 
                  ? 'bg-gradient-to-br from-primary-container to-primary-container/80 text-white rounded-2xl rounded-tr-sm shadow-lg' 
                  : 'bg-surface-container-high text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/10'
              }`}>
                {/* Simple markdown-like rendering for tutor messages */}
                {msg.role === 'tutor' ? (
                  <div className="whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, li) => {
                      if (line.startsWith('# ')) return <h3 key={li} className="font-headline font-bold text-white text-base mt-2 mb-1">{line.slice(2)}</h3>;
                      if (line.startsWith('## ')) return <h4 key={li} className="font-headline font-bold text-white text-sm mt-2 mb-1">{line.slice(3)}</h4>;
                      if (line.startsWith('- ') || line.startsWith('• ')) return <p key={li} className="ml-3 before:content-['•'] before:mr-2 before:text-primary">{line.slice(2)}</p>;
                      if (line.match(/^\d+\./)) return <p key={li} className="ml-3">{line}</p>;
                      return <p key={li}>{line}</p>;
                    })}
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start animate-cosmic-slide">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="bg-surface-container-high rounded-2xl rounded-tl-sm p-4 border border-outline-variant/10">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Bar */}
        <div className="p-4 bg-surface-container border-t border-outline-variant/10">
          <form onSubmit={handleSend} className="relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your study topics..." 
              className="pr-16 py-4"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 top-3 w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center text-on-primary disabled:opacity-30 transition-all hover:shadow-[0_0_15px_rgba(138,43,226,0.4)] hover:scale-105"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};
