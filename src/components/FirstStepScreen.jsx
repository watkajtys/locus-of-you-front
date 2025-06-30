import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Check } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

// Three-Cannon Confetti System
const ThreeCannonConfetti = ({ isActive, onComplete }) => {
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    if (isActive) {
      console.log('🎊 THREE-CANNON CONFETTI SYSTEM ACTIVATED!');
      
      // Define three cannon positions relative to the task center
      const cannons = [
        { name: 'LEFT', x: -100, delay: 400, color: 'left' },    // Left cannon fires after center
        { name: 'CENTER', x: 0, delay: 0, color: 'center' },     // Center fires first
        { name: 'RIGHT', x: 100, delay: 400, color: 'right' }    // Right fires with left
      ];

      const allPieces = [];
      
      cannons.forEach((cannon, cannonIndex) => {
        console.log(`🎯 Setting up ${cannon.name} cannon (delay: ${cannon.delay}ms)`);
        
        // Generate 20 pieces per cannon (60 total)
        const cannonPieces = Array.from({ length: 20 }, (_, i) => {
          const colors = {
            left: ['#FF6B6B', '#F39C12', '#E74C3C', '#FF8C69', '#FFB6C1'],
            center: ['#4ECDC4', '#45B7D1', '#5DADE2', '#85C1E9', '#AED6F1'], 
            right: ['#96CEB4', '#FFEAA7', '#F7DC6F', '#F4D03F', '#F8C471']
          };
          
          // Explosion angle range per cannon (120 degrees each)
          const baseAngle = cannonIndex === 0 ? 180 : cannonIndex === 1 ? 270 : 0; // Left: 180°, Center: 270° (up), Right: 0°
          const angleSpread = 120; // 120 degrees spread per cannon
          const angle = baseAngle + (Math.random() - 0.5) * angleSpread;
          
          const distance = Math.random() * 250 + 200; // 200-450px range
          const angleRad = (angle * Math.PI) / 180;
          
          // Calculate final position from cannon position
          const finalX = cannon.x + Math.cos(angleRad) * distance;
          const finalY = Math.sin(angleRad) * distance;
          
          return {
            id: `${cannon.name}-${i}`,
            cannon: cannon.name,
            color: colors[cannon.color][Math.floor(Math.random() * colors[cannon.color].length)],
            size: Math.random() * 10 + 6, // 6-16px
            delay: cannon.delay + Math.random() * 200, // Cannon delay + 0-200ms spread
            duration: Math.random() * 2000 + 2500, // 2.5-4.5s duration
            startX: cannon.x,
            startY: 0,
            finalX,
            finalY,
            rotation: Math.random() * 1080 + 720, // 2-3 full rotations
            shape: Math.random() > 0.6 ? 'circle' : 'square',
          };
        });
        
        allPieces.push(...cannonPieces);
      });
      
      setConfettiPieces(allPieces);
      console.log(`🎉 Generated ${allPieces.length} confetti pieces across 3 cannons`);
      
      // Auto-cleanup after animation
      const cleanup = setTimeout(() => {
        console.log('🧹 Cleaning up confetti');
        setConfettiPieces([]);
        onComplete && onComplete();
      }, 6000);
      
      return () => clearTimeout(cleanup);
    }
  }, [isActive, onComplete]);

  const ConfettiPiece = ({ piece }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        console.log(`🚀 Firing ${piece.cannon} cannon piece ${piece.id}`);
        setIsAnimating(true);
      }, piece.delay);
      
      return () => clearTimeout(timer);
    }, [piece.delay, piece.cannon, piece.id]);

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: `${piece.size}px`,
          height: `${piece.size}px`,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : '2px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transform: isAnimating 
            ? `translate(-50%, -50%) translate(${piece.finalX}px, ${piece.finalY}px) rotate(${piece.rotation}deg)`
            : `translate(-50%, -50%) translate(${piece.startX}px, ${piece.startY}px)`,
          opacity: isAnimating ? 0 : 1,
          transition: `all ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
          zIndex: -1, // Behind the task card
        }}
      />
    );
  };

  if (!isActive || confettiPieces.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} />
      ))}
    </div>
  );
};

const FirstStepScreen = ({ answers, onComplete, onChangeStep }) => {
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
    
    // Trigger three-cannon confetti celebration when task becomes completed
    if (newCompletedState) {
      console.log('🎊 ACTIVATING THREE-CANNON CONFETTI SYSTEM!');
      console.log('📋 Firing sequence: CENTER (0ms) → LEFT + RIGHT (400ms)');
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  };

  // Handle confetti completion
  const handleConfettiComplete = () => {
    console.log('✨ Three-cannon confetti celebration completed');
    setShowConfetti(false);
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

            {/* Second Card - The Task with three-cannon confetti system */}
            <div className="relative" style={{ zIndex: 1 }}>
              {/* Three-Cannon Confetti System - Behind the task */}
              <ThreeCannonConfetti 
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
                  position: 'relative',
                  zIndex: 2, // Above the confetti
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
                  {/* Large Checkbox Icon - ENTIRE CONTAINER BOUNCES */}
                  <div 
                    className={`
                      flex-shrink-0 transition-all duration-200
                      ${isTaskCompleted ? 'animate-bounce' : ''}
                    `}
                    style={{
                      animation: isTaskCompleted ? 'celebrate-bounce 0.8s ease-in-out infinite' : 'none'
                    }}
                  >
                    {isTaskCompleted ? (
                      <div className="relative w-8 h-8 md:w-10 md:h-10">
                        {/* Green Circle Background with Pulse */}
                        <div 
                          className="absolute inset-0 rounded-full bg-green-600"
                          style={{ 
                            backgroundColor: '#16a34a',
                            animation: 'celebrate-pulse 1s ease-in-out infinite'
                          }}
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