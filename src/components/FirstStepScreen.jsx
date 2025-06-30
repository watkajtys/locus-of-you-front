import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

const FirstStepScreen = ({ answers, onComplete, onChangeStep }) => {
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

            {/* Second Card - The Task with consistent styling */}
            <div className="relative">
              <div
                className="
                  relative bg-white shadow-lg border border-gray-200
                  rounded-tl-xl rounded-bl-xl rounded-br-xl
                  pt-8 px-8 pb-8 md:px-10 md:pb-10
                  transition-all duration-300 ease-in-out
                  hover:shadow-xl hover:-translate-y-1
                "
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* The Tab - matching AIMessageCard style */}
                <div 
                  className="
                    absolute top-0 right-0 -translate-y-1/2
                    bg-slate-100 px-4 py-0.5 
                    rounded-tl-lg rounded-tr-lg
                    border border-slate-200 border-b-0
                    shadow-sm
                  "
                >
                  <span 
                    className="text-xs font-semibold tracking-widest uppercase select-none text-slate-600"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    YOUR TASK
                  </span>
                </div>

                {/* Task Content with Checkbox */}
                <div className="flex items-start space-x-6">
                  {/* Large Checkbox Icon */}
                  <div className="flex-shrink-0 pt-2">
                    <Circle 
                      className="w-8 h-8 md:w-10 md:h-10"
                      style={{ color: 'var(--color-accent)' }}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Task Text */}
                  <div className="flex-1">
                    <p 
                      className="text-2xl md:text-3xl font-bold leading-relaxed"
                      style={{ 
                        color: 'var(--color-text)',
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
                className="group flex items-center space-x-3 text-xl px-12 py-6"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Mark as Complete</span>
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
              Remember: The goal isn't to be perfect, it's to be consistent.
            </p>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default FirstStepScreen;