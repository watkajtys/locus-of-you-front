import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import { supabase } from '../lib/supabase'; // Import supabase

const CoachingInterface = ({ session, hasSubscription }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Welcome back! I'm here to help you navigate whatever's on your mind. What would you like to work on today?",
      cardType: 'WELCOME',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated.');
      }

      const workerApiUrl = import.meta.env.VITE_WORKER_API_URL;
      if (!workerApiUrl) {
        throw new Error('VITE_WORKER_API_URL is not defined in environment variables.');
      }

      const response = await fetch(`${workerApiUrl}/api/coaching/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` // Assuming session has access_token
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: session?.id || 'default_session', // Use session ID if available, otherwise a default
          context: {}, // You can add more context here if needed
          message: userMessage.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI response from worker.');
      }

      const result = await response.json();
      const aiResponseContent = result.data?.response || "I'm sorry, I couldn't generate a response.";
      const aiCardType = result.data?.cardType || 'COACHING RESPONSE'; // Assuming worker returns cardType

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        cardType: aiCardType,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error communicating with AI worker:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm having trouble processing that right now: ${error.message}. Please try again.`,
        cardType: 'SYSTEM MESSAGE',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AuraProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header 
          className="flex-shrink-0 border-b backdrop-blur-sm px-6 py-4"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            opacity: '0.95'
          }}
        >
          <div className="flex items-center space-x-4">
            <AuraAvatar size={48} />
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: 'var(--color-text)' }}
              >
                Your AI Coach
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-muted)' }}
              >
                {hasSubscription ? 'Premium Coaching Session' : 'Limited Session'}
              </p>
            </div>
          </div>
        </header>

        {/* Messages Area - Updated with max-width and centering */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {message.type === 'user' ? (
                /* User Message */
                <div className="flex justify-end">
                  <div 
                    className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl rounded-br-md shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--color-accent)',
                      color: 'white'
                    }}
                  >
                    <p className="text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ) : (
                /* AI Message */
                <div className="flex justify-start">
                  <div className="max-w-2xl w-full">
                    <AIMessageCard
                      paragraph={message.content}
                      cardType={message.cardType}
                      className="shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl w-full">
                <div
                  className="px-6 py-4 rounded-2xl shadow-sm border flex items-center space-x-3"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <Loader2 
                    className="w-5 h-5 animate-spin"
                    style={{ color: 'var(--color-accent)' }}
                  />
                  <span 
                    className="text-sm italic"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div 
          className="flex-shrink-0 border-t backdrop-blur-sm px-4 py-4"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            opacity: '0.98'
          }}
        >
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={hasSubscription 
                  ? "What's on your mind? I'm here to help..." 
                  : "Ask me anything (limited messages remaining)..."
                }
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 border rounded-2xl resize-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <Button
              variant="accent"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default CoachingInterface;