import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MusicTheoryPanel({
  isOpen,
  onClose,
  chartData,
  sectionData,
  selectedMeasure
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🎓 Hi! I\'m your music theory professor. Ask me anything about the chords, progressions, or music theory concepts in this chart!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('musicTheoryProfessor', {
        chartData,
        sectionData,
        selectedMeasure,
        userQuestion: userMessage
      });

      if (response.data?.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.explanation
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Theory question error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I had trouble processing your question. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#141414] border-l border-[#2a2a2a] shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <h2 className="text-sm font-semibold text-white">Music Theory</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-[#6b6b6b] hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-[#D0021B] text-white'
                  : 'bg-[#252525] text-[#a0a0a0]'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#252525] rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#6b6b6b]" />
              <span className="text-sm text-[#6b6b6b]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-4 space-y-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about chords, progressions, theory..."
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b] focus:border-red-600 focus:ring-red-600/20"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="w-full bg-[#D0021B] hover:bg-[#A0011B] text-white disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          Ask Professor
        </Button>
      </div>
    </div>
  );
}