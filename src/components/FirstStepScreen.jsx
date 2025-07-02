import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Check } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import boltBadge from '../assets/bolt-badge.png';

// Confetti Component with JavaScript-based animation
const ConfettiExplosion = ({ isActive, onComplete }) => {
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces with calculated positions
      const pieces = Array.from({ length: 50 }, (_, i) => {
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
          '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
          '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#A9DFBF'
        ];
        
        const angle = Math.random() * 360;
        const distance = Math.random() * 300 + 150;
        const angleRad = (angle * Math.PI) / 180;
        
        // Calculate final position using trigonometry
        const finalX = Math.cos(angleRad) * distance;
        const finalY = Math.sin(angleRad) * distance;
        
        return {
          id: i,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          delay: Math.random() * 300, // 0-300ms delay
          duration: Math.random() * 1500 + 2000, // 2-3.5s duration
          finalX,
          finalY,
          rotation: Math.random() * 720 + 360,
          shape: Math.random() > 0.5 ? 'circle' : 'square',
        };
      });
      
      setConfettiPieces(pieces);
      
      // Auto-hide confetti after animation completes
      const timer = setTimeout(() => {
        setConfettiPieces([]);
        onComplete && onComplete();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  const ConfettiPiece = ({ piece }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, piece.delay);
      
      return () => clearTimeout(timer);
    }, [piece.delay]);

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: `${piece.size}px`,
          height: `${piece.size}px`,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : '0%',
          transform: isAnimating 
            ? `translate(-50%, -50%) translate(${piece.finalX}px, ${piece.finalY}px) rotate(${piece.rotation}deg)`
            : 'translate(-50%, -50%)',
          opacity: isAnimating ? 0 : 1,
          transition: `all ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
          zIndex: 1000,
        }}
      />
    );
  };

  if (!isActive || confettiPieces.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} />
      ))}
    </div>
  );
};

const FirstStepScreen = ({ answers, onComplete, onChangeStep, onboardingUserId }) => {
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rationale, setRationale] = useState('');
  const [task, setTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('FirstStepScreen useEffect triggered'); // Add this line
    const fetchMicrotask = async () => {
      console.log('Inside fetchMicrotask: onboardingUserId', onboardingUserId);
      console.log('Inside fetchMicrotask: answers', answers);
      if (!onboardingUserId || !answers) {
        setError('User ID or onboarding answers not available.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_WORKER_API_URL}/api/microtask/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: onboardingUserId,
            onboardingAnswers: answers,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw microtask response text:', text); // Log raw response

        let jsonString = text.trim(); // Start with the raw text, trimmed

        // First, try to parse the raw text directly. If it's valid JSON, we're good.
        try {
          JSON.parse(jsonString);
        } catch (e) {
          // If direct parsing fails, it might be wrapped in markdown. Try to extract.
          const jsonStringMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonStringMatch && jsonStringMatch[1]) {
            jsonString = jsonStringMatch[1].trim(); // Use extracted content if match found
          } else {
            // If no markdown block found and direct parse failed, then it's an invalid format.
            throw new Error('Could not extract JSON from response or JSON string is empty.');
          }
        }

        console.log('Extracted microtask jsonString (after trim):', jsonString); // Log extracted string

        if (!jsonString) {
          throw new Error('Extracted JSON string is empty or null.');
        }

        let data;
        try {
          data = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Error parsing microtask response: ${parseError.message}. Attempted to parse: "${jsonString.substring(0, 200)}..."`); // Show a snippet of the problematic string
        }

        if (!data || (data.success === false && data.error?.message)) {
          throw new Error(data.error.message || 'Failed to generate microtask: Unknown error.');
        }

        // Set the rationale and task from the fetched data
        setRationale(data.data.rationale);
        setTask(data.data.task);
      } catch (err) {
        console.error("Error fetching microtask:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMicrotask();
  }, [onboardingUserId, answers]);

  // Handle task completion toggle
  const handleTaskClick = () => {
    const newCompletedState = !isTaskCompleted;
    setIsTaskCompleted(newCompletedState);
    
    // Trigger confetti celebration when task becomes completed
    if (newCompletedState) {
      console.log('🎉 FIRING CONFETTI!'); // Debug log
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  };

  // Handle confetti completion
  const handleConfettiComplete = () => {
    console.log('✨ Confetti animation completed'); // Debug log
    setShowConfetti(false);
  };

  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6 relative"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Bolt Badge */}
        <div className="absolute top-4 right-4 z-50">
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
            <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" />
          </a>
        </div>
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {/* Header with Aura */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="space-y-2">
              <h1 
                className="text-3xl md:text-4xl font-bold leading-tight"
                style={{ color: 'var(--color-text)' }}
              >
                {answers?.name ? `${answers.name}, Your First Step` : 'Your First Step'}
              </h1>
              <p 
                className="text-lg"
                style={{ color: 'var(--color-muted)' }}
              >
                {answers?.name ? `Let's find your impossibly small first step, ${answers.name}.` : "Let's start with something impossibly small."}
              </p>
            </div>
          </div>

          {/* First Card - AI Rationale */}
          <div className="space-y-6">
            {isLoading && <p className="text-center text-gray-500">Generating your first step...</p>}
            {error && <p className="text-center text-red-500">Error: {error}</p>}
            {!isLoading && !error && (
              <>
                <AIMessageCard 
                  paragraph={rationale}
                  cardType="YOUR AI COACH"
                />

                {/* Second Card - The Task with consistent styling and confetti */}
                <div className="relative">
                  {/* Confetti Explosion */}
                  <ConfettiExplosion 
                    isActive={showConfetti} 
                    onComplete={handleConfettiComplete}
                  />
                  
                  <div
                    className={`
                      relative shadow-lg border
                      rounded-tl-xl rounded-bl-xl rounded-br-xl
                      pt-8 px-8 pb-8 md:px-10 md:pb-10
                      transition-all duration-300 ease-in-out
                      hover:shadow-xl hover:-translate-y-1 cursor-pointer
                      ${isTaskCompleted 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }
                    `}
                    style={{
                      backgroundColor: isTaskCompleted ? '#f0fdf4' : 'var(--color-card)',
                      borderColor: isTaskCompleted ? '#bbf7d0' : 'var(--color-border)',
                    }}
                    onClick={handleTaskClick}
                  >
                    {/* The Tab - matching AIMessageCard style */}
                    <div 
                      className={`
                        absolute top-0 right-0 -translate-y-1/2
                        px-4 py-0.5 
                        rounded-tl-lg rounded-tr-lg
                        border border-b-0 shadow-sm
                        ${isTaskCompleted 
                          ? 'bg-green-100 border-green-200' 
                          : 'bg-slate-100 border-slate-200'
                        }
                      `}
                    >
                      <span 
                        className={`
                          text-xs font-semibold tracking-widest uppercase select-none
                          ${isTaskCompleted ? 'text-green-700' : 'text-slate-600'}
                        `}
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {isTaskCompleted ? 'COMPLETED' : 'YOUR TASK'}
                      </span>
                    </div>

                    {/* Task Content with Checkbox */}
                    <div className="flex items-center space-x-6">
                      {/* Large Checkbox Icon - BOUNCES ONCE WHEN COMPLETED */}
                      <div className="flex-shrink-0">
                        {isTaskCompleted ? (
                          <div 
                            className="relative w-8 h-8 md:w-10 md:h-10"
                            style={{ 
                              animation: 'celebrate-jump 0.6s ease-in-out'
                            }}
                          >
                            {/* Green Circle Background */}
                            <div 
                              className="absolute inset-0 rounded-full bg-green-600"
                              style={{ backgroundColor: '#16a34a' }}
                            />
                            {/* Centered White Checkmark */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check 
                                className="w-5 h-5 md:w-6 md:h-6 text-white"
                                strokeWidth={3}
                              />
                            </div>
                          </div>
                        ) : (
                          <Circle 
                            className="w-8 h-8 md:w-10 md:h-10"
                            style={{ color: 'var(--color-accent)' }}
                            strokeWidth={2}
                          />
                        )}
                      </div>

                      {/* Task Text */}
                      <div className="flex-1">
                        <p 
                          className={`
                            text-2xl md:text-3xl font-bold leading-relaxed
                            ${isTaskCompleted ? 'text-green-800 line-through' : ''}
                          `}
                          style={{ 
                            color: isTaskCompleted ? '#166534' : 'var(--color-text)',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {task}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="pt-4">
              <Button
                variant="accent"
                size="large"
                onClick={onComplete}
                disabled={!isTaskCompleted}
                className={`
                  group flex items-center space-x-3 text-xl px-12 py-6
                  ${!isTaskCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <CheckCircle className="w-6 h-6" />
                <span>Keep My Momentum Going</span>
              </Button>
            </div>
            
            <div>
              <button
                onClick={onChangeStep}
                disabled={isLoading || error}
                className={`
                  text-base font-medium transition-all duration-200 hover:underline hover:scale-105
                  ${isLoading || error ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ color: 'var(--color-muted)' }}
              >
                I need a different first step
              </button>
            </div>
          </div>

          {/* Encouraging Footer */}
          <div className="text-center pt-8">
            <p 
              className="text-sm italic"
              style={{ color: 'var(--color-muted)' }}
            >
              {isTaskCompleted 
                ? (answers?.name ? `🎉 Amazing ${answers.name}! You've taken the first step towards building consistency!` : "🎉 Amazing! You've taken the first step towards building consistency!") 
                : "Remember: The goal isn't to be perfect, it's to be consistent."
              }
            </p>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default FirstStepScreen;