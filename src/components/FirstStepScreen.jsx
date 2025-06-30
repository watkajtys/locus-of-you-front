import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

const FirstStepScreen = ({ answers, onComplete, onChangeStep }) => {
  // Generate personalized micro-victory based on user's profile and goal
  const generateMicroVictory = (answers) => {
    const userGoal = answers?.final_focus || "building better habits";
    const mindset = answers?.mindset;
    const locus = answers?.locus;
    
    // Default micro-victory with placeholder text
    let microVictory = "Your profile shows the best way to build a new habit is to start with a non-negotiable, small win. Based on your goal, your only task for today is this: Decide on the specific time tomorrow you will put your running shoes on. That's the entire goal.";
    
    // Customize based on user's goal if it contains specific keywords
    if (userGoal.toLowerCase().includes('exercise') || userGoal.toLowerCase().includes('fitness') || userGoal.toLowerCase().includes('running')) {
      if (mindset === 'growth' && locus === 'internal') {
        microVictory = "Your profile shows you're driven by personal growth and action. Based on your fitness goal, your only task for today is this: Decide on the specific time tomorrow you will put your running shoes on. That's the entire goal.";
      } else {
        microVictory = "Your profile shows the best way to build a new habit is to start with a non-negotiable, small win. Based on your fitness goal, your only task for today is this: Choose exactly where you will place your workout clothes tonight. That's the entire goal.";
      }
    } else if (userGoal.toLowerCase().includes('read') || userGoal.toLowerCase().includes('book')) {
      if (mindset === 'growth' && locus === 'internal') {
        microVictory = "Your profile shows you're driven by personal growth and action. Based on your reading goal, your only task for today is this: Place one specific book on your pillow before you go to bed tonight. That's the entire goal.";
      } else {
        microVictory = "Your profile shows the best way to build a new habit is to start with a non-negotiable, small win. Based on your reading goal, your only task for today is this: Decide on the exact spot where you will keep your book visible. That's the entire goal.";
      }
    } else if (userGoal.toLowerCase().includes('write') || userGoal.toLowerCase().includes('journal')) {
      if (mindset === 'growth' && locus === 'internal') {
        microVictory = "Your profile shows you're driven by personal growth and action. Based on your writing goal, your only task for today is this: Open a blank document and type just your name and today's date. That's the entire goal.";
      } else {
        microVictory = "Your profile shows the best way to build a new habit is to start with a non-negotiable, small win. Based on your writing goal, your only task for today is this: Place a pen and paper on the table where you eat breakfast. That's the entire goal.";
      }
    } else if (userGoal.toLowerCase().includes('meditat') || userGoal.toLowerCase().includes('mindful')) {
      if (mindset === 'growth' && locus === 'internal') {
        microVictory = "Your profile shows you're driven by personal growth and action. Based on your mindfulness goal, your only task for today is this: Set a 2-minute timer and sit in the same chair you'll use tomorrow. That's the entire goal.";
      } else {
        microVictory = "Your profile shows the best way to build a new habit is to start with a non-negotiable, small win. Based on your mindfulness goal, your only task for today is this: Decide on the specific chair or spot where you will sit tomorrow. That's the entire goal.";
      }
    } else {
      // Generic micro-victory based on their profile
      if (mindset === 'growth' && locus === 'internal') {
        microVictory = `Your profile shows you're driven by personal growth and action. Based on your goal of "${userGoal}", your only task for today is this: Write down the single smallest first step you could take tomorrow, then decide what time you'll do it. That's the entire goal.`;
      } else if (locus === 'external') {
        microVictory = `Your profile shows you work best with clear structure and environmental support. Based on your goal of "${userGoal}", your only task for today is this: Set up one small thing in your environment that will make tomorrow's first step easier. That's the entire goal.`;
      } else {
        microVictory = `Your profile shows the best way to build momentum is with a non-negotiable, small win. Based on your goal of "${userGoal}", your only task for today is this: Decide on the specific time tomorrow you will take your first small step. That's the entire goal.`;
      }
    }
    
    return microVictory;
  };

  const microVictory = generateMicroVictory(answers);

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

          {/* Main AI Message Card - No wrapper divs or glass effects */}
          <AIMessageCard 
            paragraph={microVictory}
            cardType="YOUR FIRST MICRO-VICTORY"
          />

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