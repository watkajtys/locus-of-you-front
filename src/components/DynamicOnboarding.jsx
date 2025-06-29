import React, { useState } from 'react';
import { ChevronRight, User, Brain } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import Card from './Card';
import Button from './Button';

const DynamicOnboarding = ({ onComplete, onSkip }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Question data structure
  const questions = [
    {
      id: 'mindset',
      type: 'choice',
      title: "To start, I'm curious about your take on this:",
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
      title: "That's helpful, thank you.",
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

  // Calculate progress percentage
  const progressPercentage = (currentQuestion / questions.length) * 100;

  // Reset selected answer when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
  }, [currentQuestion]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswer(answer);
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    setAnswers(newAnswers);

    // Auto-advance to next question after a brief delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Assessment complete
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
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pt-8 md:pt-12 pb-4 md:pb-8">
          {/* Welcome Text */}
          <div className="text-center mb-4 md:mb-6">
            <div className="flex justify-center mb-6">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h1 
              className="text-2xl md:text-4xl font-semibold mb-4 md:mb-6 leading-relaxed max-w-3xl mx-auto"
              style={{ color: 'var(--color-text)' }}
            >
              I'm a new type of AI coach that helps you take action by first understanding what's holding you back.
            </h1>
            
            <p 
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'var(--color-muted)' }}
            >
              We'll discover your unique motivational profile to build a plan that actually works.
            </p>
          </div>

          {/* Progress Section */}
          <div className="max-w-2xl mx-auto">
            {/* Progress Label */}
            <h2 
              className="text-sm font-medium tracking-wide uppercase mb-3 text-center"
              style={{ color: 'var(--color-muted)' }}
            >
              Motivational DNA Profile
            </h2>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Progress Percentage */}
            <div className="text-center mt-2">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="max-w-4xl mx-auto w-full">
            {currentQuestionData && (
              <div className="space-y-8 animate-fade-in">
                {/* Question Header */}
                <div className="text-center space-y-4">
                  {currentQuestionData.title && (
                    <p 
                      className="text-base font-normal"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {currentQuestionData.title}
                    </p>
                  )}
                  
                  <h3 
                    className="text-2xl md:text-3xl font-bold leading-relaxed max-w-3xl mx-auto text-sky-900"
                  >
                    {currentQuestionData.question}
                  </h3>
                </div>

                {/* Answer Options */}
                {currentQuestionData.type === 'choice' && (
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {currentQuestionData.options.map((option) => (
                      <Card
                        key={option.id}
                        hover
                        className={`
                          p-8 cursor-pointer group relative overflow-hidden
                          transition-all duration-300 ease-in-out transform
                          hover:scale-105 hover:shadow-xl
                          shadow-lg
                          ${selectedAnswer === option.value 
                            ? 'border-2 border-sky-600 shadow-xl' 
                            : 'border border-transparent hover:border-sky-300'
                          }
                        `}
                        onClick={() => handleAnswerSelect(currentQuestionData.id, option.value)}
                      >
                        {/* Burned-in Letter Background */}
                        <div className="absolute left-0 top-0 h-full flex items-center justify-start pointer-events-none">
                          <span 
                            className={`text-8xl md:text-9xl font-black select-none leading-none transform -translate-x-4 transition-opacity duration-300 ${
                              selectedAnswer === option.value ? 'text-gray-400/60' : 'text-gray-300/40'
                            }`}
                            style={{ 
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            {option.id}
                          </span>
                        </div>
                        
                        {/* Content Area */}
                        <div className="h-full flex items-center relative z-10 ml-16">
                          <div className="flex-1">
                            <p 
                              className="text-lg leading-relaxed font-medium"
                              style={{ color: 'var(--color-text)' }}
                            >
                              {option.label.substring(3)} {/* Remove "A) " or "B) " prefix */}
                            </p>
                          </div>
                          
                          <div className="ml-4">
                            <ChevronRight 
                              className={`
                                w-5 h-5 transition-all duration-300 text-sky-600
                                ${selectedAnswer === option.value 
                                  ? 'opacity-100 transform translate-x-1' 
                                  : 'opacity-0 group-hover:opacity-100 group-hover:transform group-hover:translate-x-1'
                                }
                              `}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pb-12">
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