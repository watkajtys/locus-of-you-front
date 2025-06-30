import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Check } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

// Three-Cannon Confetti System - FIXED
const ThreeCannonConfetti = ({ isActive, onComplete }) => {
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    if (isActive) {
      console.log('🎊 THREE-CANNON CONFETTI SYSTEM ACTIVATED!');
      
      const allPieces = [];
      
      // Define three cannon configurations
      const cannons = [
        { 
          name: 'CENTER', 
          delay: 0, 
          baseAngle: 270, // Straight up
          colors: ['#4ECDC4', '#45B7D1', '#5DADE2', '#85C1E9', '#AED6F1']
        },
        { 
          name: 'LEFT', 
          delay: 400, 
          baseAngle: 225, // Up-left
          colors: ['#FF6B6B', '#F39C12', '#E74C3C', '#FF8C69', '#FFB6C1']
        },
        { 
          name: 'RIGHT', 
          delay: 400, 
          baseAngle: 315, // Up-right  
          colors: ['#96CEB4', '#FFEAA7', '#F7DC6F', '#F4D03F', '#F8C471']
        }
      ];

      cannons.forEach((cannon) => {
        console.log(`🎯 Setting up ${cannon.name} cannon (delay: ${cannon.delay}ms, angle: ${cannon.baseAngle}°)`);
        
        // Generate 20 pieces per cannon
        for (let i = 0; i < 20; i++) {
          const spread = 60; // 60-degree spread per cannon
          const angle = cannon.baseAngle + (Math.random() - 0.5) * spread;
          const distance = Math.random() * 300 + 150; // 150-450px
          const angleRad = (angle * Math.PI) / 180;
          
          const piece = {
            id: `${cannon.name}-${i}-${Date.now()}`,
            cannon: cannon.name,
            color: cannon.colors[Math.floor(Math.random() * cannon.colors.length)],
            size: Math.random() * 8 + 6, // 6-14px
            delay: cannon.delay + Math.random() * 100, // Slight random delay within cannon
            finalX: Math.cos(angleRad) * distance,
            finalY: Math.sin(angleRad) * distance,
            rotation: Math.random() * 720 + 360, // 1-2 full rotations
            shape: Math.random() > 0.5 ? 'circle' : 'square',
            duration: Math.random() * 1500 + 3000, // 3-4.5s duration
          };
          
          allPieces.push(piece);
        }
      });
      
      console.log(`🎉 Generated ${allPieces.length} confetti pieces across ${cannons.length} cannons`);
      setConfettiPieces(allPieces);
      
      // Cleanup after 6 seconds
      const cleanup = setTimeout(() => {
        console.log('🧹 Cleaning up confetti');
        setConfettiPieces([]);
        onComplete && onComplete();
      }, 6000);
      
      return () => clearTimeout(cleanup);
    }
  }, [isActive, onComplete]);

  const ConfettiPiece = ({ piece }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      // First make the piece visible
      setIsVisible(true);
      
      // Then start the animation after the cannon's delay
      const fireTimer = setTimeout(() => {
        console.log(`🚀 ${piece.cannon} cannon firing piece ${piece.id}`);
        setIsAnimating(true);
      }, piece.delay);
      
      // Start fading out after 70% of the animation duration
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, piece.delay + piece.duration * 0.7);
      
      return () => {
        clearTimeout(fireTimer);
        clearTimeout(fadeTimer);
      };
    }, [piece]);

    if (!isVisible && !isAnimating) return null;

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: `${piece.size}px`,
          height: `${piece.size}px`,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : '20%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transform: isAnimating 
            ? `translate(-50%, -50%) translate(${piece.finalX}px, ${piece.finalY}px) rotate(${piece.rotation}deg) scale(0.3)`
            : `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`,
          opacity: isVisible ? 1 : 0,
          transition: isAnimating 
            ? `all ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1000ms ease-out`
            : 'opacity 200ms ease-out',
          zIndex: 1, // Above background, below task card
        }}
      />
    );
  };

  if (!isActive) return null;

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }} // Behind task card but above background
    >
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
      console.log('🎊 TASK COMPLETED! ACTIVATING THREE-CANNON CONFETTI!');
      console.log('📋 Firing sequence: CENTER (0ms) → LEFT + RIGHT (400ms)');
      setShowConfetti(true);
    } else {
      console.log('❌ Task unchecked, stopping confetti');
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
                      animation: isTaskCompleted ? 'celebrate-bounce 0.8s ease-in-out 3' : 'none'
                    }}
                  >
                    {isTaskCompleted ? (
                      <div className="relative w-8 h-8 md:w-10 md:h-10">
                        {/* Green Circle Background with Pulse */}
                        <div 
                          className="absolute inset-0 rounded-full bg-green-600"
                          style={{ 
                            backgroundColor: '#16a34a',
                            animation: 'celebrate-pulse 1.5s ease-in-out infinite'
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