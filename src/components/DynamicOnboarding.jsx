import React, { useState } from 'react';
import { ChevronRight, User, Brain } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Card from './Card';
import Button from './Button';

const DynamicOnboarding = ({ onComplete, onSkip }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);
  
  // Question data structure
  const questions = [
    {
      id: 'mindset',
      type: 'choice',
      message: "To start, I'm curious about your take on this:",
      question: "Do you feel that a person's ability is something they're just born with, or is it a skill that can be developed?",
      options: [
        {
          id: 'A',
          label: "A) It's something you're born with",
          value: 'fixed'
        },
        {
          id: 'B', 
          label: "B) It's a skill that can be developed",
          value: 'growth'
        }
      ]
    },
    {
      id: 'locus',
      type: 'choice',
      message: "That's helpful, thank you.",
      question: "Now, when things feel particularly tough, does it seem more like it's due to circumstances beyond your control, or more about the choices you've made?",
      options: [
        {
          id: 'A',
          label: "A) It's due to circumstances beyond my control",
          value: 'external'
        },
        {
          id: 'B',
          label: "B) It's due to the choices I've made",
          value: 'internal'
        }
      ]
    }
  ];

  // Reset selected answer when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
    setQuestionVisible(true);
  }, [currentQuestion]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answerValue, optionData) => {
    // Prevent multiple selections during transition
    if (isTransitioning) return;
    
    // Mark as transitioning
    setIsTransitioning(true);
    
    // Step 1: Visually mark the selected card
    setSelectedAnswer(answerValue);
    
    // Step 2: Update answers state
    const newAnswers = {
      ...answers,
      [questionId]: answerValue
    };
    setAnswers(newAnswers);
    
    // Step 3: Update progress with animation
    const newProgress = ((currentQuestion + 1) / questions.length) * 100;
    setProgress(newProgress);
    
    // Step 4: 500ms delay for user to see selection
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        // Step 5: Fade out current question
        setQuestionVisible(false);
        
        // Step 6: After fade out, change question and fade in
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200); // Short fade out duration
      } else {
        // Assessment complete
        setIsTransitioning(false);
        onComplete && onComplete(newAnswers);
      }
    }, 500);
  };

  const currentQuestionData = questions[currentQuestion];

  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col font-inter"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Header Section */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pt-6 md:pt-8 pb-2 md:pb-4">
          {/* Welcome Text */}
          <div className="text-center mb-2 md:mb-4">
            <div className="flex justify-center mb-2">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h1 
              className="text-3xl md:text-4xl font-bold mb-2 md:mb-4 leading-tight max-w-3xl mx-auto"
              style={{ color: 'var(--color-text)' }}
            >
              First, understand what holds you back.
            </h1>
            
            <p 
              className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'var(--color-muted)' }}
            >
              Then, build a plan that actually works.
            </p>
          </div>

          {/* Progress Section */}
          <div className="max-w-2xl mx-auto">
            {/* Progress Label */}
            <h2 
              className="text-sm font-medium tracking-wide uppercase mb-2 text-center"
              style={{ color: 'var(--color-muted)' }}
            >
              Motivational DNA Profile
            </h2>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress Percentage */}
            <div className="text-center mt-2">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 flex items-start justify-center px-6 py-4 md:py-8">
          <div className="max-w-4xl mx-auto w-full">
            {currentQuestionData && (
              <div 
                className={`
                  space-y-6 md:space-y-8 transition-all duration-200 ease-in-out
                  ${questionVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4'
                  }
                `}
              >
                {/* AI Message Card with Question */}
                <div className="text-center">
                  <div className="max-w-2xl mx-auto">
                    <AIMessageCard 
                      message={currentQuestionData.message}
                      question={currentQuestionData.question}
                      cardType="DIAGNOSTIC QUESTION"
                    />
                  </div>
                </div>

                {/* Answer Options */}
                {currentQuestionData.type === 'choice' && (
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {currentQuestionData.options.map((option) => (
                      <div
                        key={option.id}
                        className={`
                          bg-white rounded-xl shadow-sm border transition-all duration-300 ease-in-out
                          p-6 md:p-8 group relative overflow-hidden
                          transform shadow-lg
                          ${isTransitioning 
                            ? 'cursor-wait' 
                            : 'cursor-pointer hover:scale-105 hover:shadow-xl'
                          }
                          ${selectedAnswer === option.value 
                            ? 'border-2 shadow-2xl' 
                            : 'border border-transparent hover:border-sky-300'
                          }
                        `}
                        style={{
                          backgroundColor: selectedAnswer === option.value ? 'var(--color-accent)' : 'var(--color-card)',
                          borderColor: selectedAnswer === option.value ? 'var(--color-accent)' : 'var(--color-border)',
                          ...(selectedAnswer === option.value && {
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--color-accent)'
                          })
                        }}
                        onClick={() => !isTransitioning && handleAnswerSelect(currentQuestionData.id, option.value, option)}
                      >
                        {/* Burned-in Letter Background */}
                        <div className="absolute left-0 top-0 h-full flex items-center justify-start pointer-events-none">
                          <span 
                            className={`text-8xl md:text-9xl font-black select-none leading-none transform -translate-x-4 transition-opacity duration-300 ${
                              selectedAnswer === option.value 
                                ? 'text-white/20' 
                                : 'text-gray-300/40 group-hover:text-gray-400/50'
                            }`}
                            style={{ 
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            {option.id}
                          </span>
                        </div>
                        
                        {/* Content Area */}
                        <div className="h-full flex items-center relative z-10 ml-12 md:ml-16">
                          <div className="flex-1">
                            <p 
                              className={`text-base md:text-lg leading-relaxed font-medium transition-colors duration-300 ${
                                selectedAnswer === option.value ? 'text-white' : ''
                              }`}
                              style={{ 
                                color: selectedAnswer === option.value ? 'white' : 'var(--color-text)'
                              }}
                            >
                              {option.label.substring(3)} {/* Remove "A) " or "B) " prefix */}
                            </p>
                          </div>
                          
                          <div className="ml-4">
                            <ChevronRight 
                              className={`
                                w-5 h-5 transition-all duration-300
                                ${selectedAnswer === option.value 
                                  ? 'opacity-100 transform translate-x-1 text-white' 
                                  : 'opacity-0 group-hover:opacity-100 group-hover:transform group-hover:translate-x-1 text-sky-600'
                                }
                              `}
                              style={{
                                color: selectedAnswer === option.value ? 'white' : 'var(--color-accent)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pb-6 md:pb-12">
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-sm"
            >
              Skip for now & get my preliminary snapshot
            </Button>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default DynamicOnboarding;