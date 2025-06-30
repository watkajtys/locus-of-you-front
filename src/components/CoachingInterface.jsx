import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

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

  // Simulate AI response
  const generateAIResponse = async (userMessage) => {
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Sample AI responses based on message content
    const responses = [
      {
        content: "I hear you saying that you're feeling stuck. That's actually a really common experience, and it often happens when we're on the edge of growth. Let me ask you this: what's one small thing that felt manageable the last time you moved forward on something similar?",
        cardType: 'COACHING QUESTION'
      },
      {
        content: "What you're describing sounds like your inner critic is pretty loud right now. That voice that tells us we're not doing enough, or not doing it right - it's trying to protect us, but it's not always helpful. What would it look like to acknowledge that voice without letting it drive the conversation?",
        cardType: 'PERSPECTIVE SHIFT'
      },
      {
        content: "I notice a pattern in how you're approaching this. You seem to be putting a lot of pressure on yourself to have everything figured out before you start. What if the goal wasn't to have it all figured out, but just to take the next smallest step?",
        cardType: 'OBSERVATION'
      },
      {
        content: "Based on what you've shared, I think there might be value in trying something I call 'micro-momentum.' Instead of thinking about the whole goal, what if you committed to just 2 minutes of action tomorrow? Sometimes the hardest part is just proving to ourselves that we can start.",
        cardType: 'STRATEGY SUGGESTION'
      }
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

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
      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.content,
        cardType: aiResponse.cardType,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm having trouble processing that right now. Could you try rephrasing your question?",
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
  );
};

export default CoachingInterface;