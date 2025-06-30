import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Circle, Check } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

// Confetti Component with JavaScript-based animation
const ConfettiExplosion = ({ isActive, onComplete }) => {
  const [confettiPieces, setConfettiPieces] = useState([]);
  const hasFiredForCurrentActivation = useRef(false);

  useEffect(() => {
    if (isActive) {
      if (!hasFiredForCurrentActivation.current) {
        hasFiredForCurrentActivation.current = true;
        console.log('🎆 CONFETTI EFFECT TRIGGERED (True Single Fire)'); // Debug log

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
        console.log('⏰ CONFETTI CLEANUP TIMER FIRED'); // Debug log
        setConfettiPieces([]);
        onComplete && onComplete();
      }, 4000);
      
      return () => {
        console.log('🧹 CONFETTI CLEANUP'); // Debug log
        clearTimeout(timer);
        // Do not reset hasFiredForCurrentActivation.current here,
        // as this cleanup is for the current activation.
        // It will be reset when isActive becomes false.
      };
      }
    } else {
      // If isActive becomes false, reset the ref for the next activation.
      hasFiredForCurrentActivation.current = false;
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

const FirstStepScreen = ({ answers, onComplete, onChangeStep }) => {
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);

  // Memoize the confetti completion handler to prevent useEffect re-runs
  const handleConfettiComplete = useCallback(() => {
    console.log('✨ Confetti animation completed (memoized callback)'); // Debug log
    setShowConfetti(false);
  }, []);

  // Generate personalized micro-victory based on user's profile and goal
  const generateMicroVictoryContent = (answers) => {
    const userGoal = answers?.final_focus || "building better habits";
    const mindset = answers?.mindset;
    const locus = answers?.locus;
    
    // Generate the rationale (same for all users with minor customization)
    const rationale = `Your profile shows you're driven by personal growth and action. Based on your goal of "${userGoal}," I've defined your first micro-victory below.`;
    
    // Generate the specific task based on user's goal and profile
    let task = "Write down the single smallest first step you could take tomorrow, and decide what time you'll do it.";
    
    // Customize task based on user's goal if it contains specific keywords
    if (userGoal.toLowerCase().includes('exercise') || userGoal.toLowerCase().includes('fitness') || userGoal.toLowerCase().includes('running')) {
      if (mindset === 'growth' && locus === 'internal') {
        task = "Decide on the specific time tomorrow you will put your running shoes on.";
      } else {
        task = "Choose exactly where you will place your workout clothes tonight.";
      }
    } else if (userGoal.toLowerCase().includes('read') || userGoal.toLowerCase().includes('book')) {
      if (mindset === 'growth' && locus === 'internal') {
        task = "Place one specific book on your pillow before you go to bed tonight.";
      } else {
        task = "Decide on the exact spot where you will keep your book visible.";
      }
    } else if (userGoal.toLowerCase().includes('write') || userGoal.toLowerCase().includes('journal')) {
      if (mindset === 'growth' && locus === 'internal') {
        task = "Open a blank document and type just your name and today's date.";
      } else {
        task = "Place a pen and paper on the table where you eat breakfast.";
      }
    } else if (userGoal.toLowerCase().includes('meditat') || userGoal.toLowerCase().includes('mindful')) {
      if (mindset === 'growth' && locus === 'internal') {
        task = "Set a 2-minute timer and sit in the same chair you'll use tomorrow.";
      } else {
        task = "Decide on the specific chair or spot where you will sit tomorrow.";
      }
    } else {
      // Generic task based on their profile
      if (mindset === 'growth' && locus === 'internal') {
        task = "Write down the single smallest first step you could take tomorrow, then decide what time you'll do it.";
      } else if (locus === 'external') {
        task = "Set up one small thing in your environment that will make tomorrow's first step easier.";
      } else {
        task = "Decide on the specific time tomorrow you will take your first small step.";
      }
    }
    
    return { rationale, task };
  };

  const { rationale, task } = generateMicroVictoryContent(answers);

  // Handle task completion toggle
  const handleTaskClick = () => {
    const newCompletedState = !isTaskCompleted;
    setIsTaskCompleted(newCompletedState);
    
    // Trigger confetti celebration and bounce when task becomes completed
    if (newCompletedState) {
      console.log('🎉 TASK COMPLETED - TRIGGERING SINGLE CONFETTI & BOUNCE!'); // Debug log
      setShowConfetti(true);
      setShouldBounce(true);
      
      // Reset bounce after animation completes
      setTimeout(() => {
        setShouldBounce(false);
      }, 800); // Slightly longer than animation duration
    } else {
      console.log('❌ Task uncompleted - stopping confetti'); // Debug log
      setShowConfetti(false);
      setShouldBounce(false);
    }
  };

  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
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
                Your First Step
              </h1>
              <p 
                className="text-lg"
                style={{ color: 'var(--color-muted)' }}
              >
                Let's start with something impossibly small
              </p>
            </div>
          </div>

          {/* First Card - AI Rationale */}
          <div className="space-y-6">
            <AIMessageCard 
              paragraph={rationale}
              cardType="YOUR AI COACH"
            />

            {/* Second Card - The Task with consistent styling and confetti */}
            <div className="relative">
              {/* Confetti Explosion - Now with memoized callback */}
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
                        className={`relative w-8 h-8 md:w-10 md:h-10 ${shouldBounce ? 'celebrate-bounce' : ''}`}
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
                <span>Continue to Sign Up</span>
              </Button>
            </div>
            
            <div>
              <button
                onClick={onChangeStep}
                className="text-base font-medium transition-all duration-200 hover:underline hover:scale-105"
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
                ? "🎉 Amazing! You've taken the first step towards building consistency!" 
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