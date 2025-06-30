import React, { useState, useEffect } from 'react';
import { ChevronRight, User, Brain } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Card from './Card';
import Button from './Button';
import { useOnboardingPersistence } from '../hooks/useOnboardingPersistence';

const DynamicOnboarding = ({ onComplete, onSkip }) => {
  const { 
    loading: persistenceLoading, 
    saveOnboardingProgress, 
    getProgress, 
    canResume,
    clearOnboardingProgress
  } = useOnboardingPersistence();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [sliderValue, setSliderValue] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  
  // Load persisted data on mount
  useEffect(() => {
    if (!persistenceLoading) {
      const savedProgress = getProgress();
      
      if (canResume() && savedProgress.progressPercentage > 0) {
        setShowResumePrompt(true);
      }
    }
  }, [persistenceLoading, canResume, getProgress]);

  // Resume from saved progress
  const handleResume = () => {
    const savedProgress = getProgress();
    
    if (savedProgress.data) {
      setAnswers(savedProgress.data);
      
      // Find current question based on completed steps
      const completedSteps = savedProgress.completedSteps || [];
      const nextQuestionIndex = Math.min(completedSteps.length, questions.length - 1);
      
      setCurrentQuestion(nextQuestionIndex);
      setProgress(savedProgress.progressPercentage);
    }
    
    setShowResumePrompt(false);
  };

  // Start fresh
  const handleStartFresh = async () => {
    await clearOnboardingProgress();
    setShowResumePrompt(false);
    setCurrentQuestion(0);
    setProgress(0);
    setAnswers({});
  };

  // Auto-save progress whenever answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const currentStepName = questions[currentQuestion]?.id || 'unknown';
      const completedSteps = Object.keys(answers);
      
      // Debounce the save operation
      const timeoutId = setTimeout(() => {
        saveOnboardingProgress(answers, currentStepName, completedSteps);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [answers, currentQuestion, saveOnboardingProgress]);

  // Updated question data structure with extreme labels
  const questions = [
    {
      id: 'mindset',
      type: 'choice',
      message: "To start, I'm curious about your take on this:",
      question: "Do you feel that a person's ability is something they're just born with, or is it a skill that can be developed?",
      cardType: "MINDSET DIAGNOSTIC",
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
      cardType: "PERSPECTIVE DIAGNOSTIC",
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
    },
    {
      id: 'regulatory_focus',
      type: 'choice',
      message: "That makes sense. Now, let's think about goals.",
      question: "When you think about achieving your goals, which of these feels more like you?",
      cardType: "FOCUS DIAGNOSTIC",
      options: [
        {
          id: 'A',
          label: "A) I'm usually striving to reach my hopes and aspirations",
          value: 'promotion'
        },
        {
          id: 'B',
          label: "B) I'm usually focused on fulfilling my duties and responsibilities",
          value: 'prevention'
        }
      ]
    },
    {
      id: 'personality_disorganized',
      type: 'slider',
      message: "Okay, just a few more to get a complete picture of your style. Let's go through some quick-fire statements. Please rate how much this describes you:",
      question: "I tend to be disorganized.",
      cardType: "PERSONALITY DIAGNOSTIC",
      min: 1,
      max: 5,
      extremeLabels: {
        min: "Strongly Disagree",
        max: "Strongly Agree"
      }
    },
    {
      id: 'personality_outgoing',
      type: 'slider',
      message: "And how about this one:",
      question: "I see myself as someone who is outgoing and sociable.",
      cardType: "PERSONALITY DIAGNOSTIC",
      min: 1,
      max: 5,
      extremeLabels: {
        min: "Strongly Disagree",
        max: "Strongly Agree"
      }
    },
    {
      id: 'personality_moody',
      type: 'slider',
      message: "Last one for this set:",
      question: "I can be moody or have up and down mood swings.",
      cardType: "PERSONALITY DIAGNOSTIC",
      min: 1,
      max: 5,
      extremeLabels: {
        min: "Strongly Disagree",
        max: "Strongly Agree"
      }
    },
    {
      id: 'final_focus',
      type: 'textInput',
      message: "Perfect, that's everything I need. For the final step, let's focus on what's important to you right now.",
      question: "Thinking about what's on your plate, what's one thing that, if you could make even a tiny bit of progress on it, would bring a little more ease or energy into your life?",
      cardType: "GOAL DIAGNOSTIC",
      placeholder: "Type your response here..."
    }
  ];

  // Reset input states when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
    setSliderValue(3);
    setTextInput('');
    setQuestionVisible(true);
  }, [currentQuestion]);

  // Handle choice answer selection
  const handleAnswerSelect = (questionId, answerValue, optionData) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSelectedAnswer(answerValue);
    
    const newAnswers = {
      ...answers,
      [questionId]: answerValue
    };
    setAnswers(newAnswers);
    
    const newProgress = ((currentQuestion + 1) / questions.length) * 100;
    setProgress(newProgress);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setQuestionVisible(false);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200);
      } else {
        setIsTransitioning(false);
        onComplete && onComplete(newAnswers);
      }
    }, 500);
  };

  // Handle fluid slider input
  const handleSliderChange = (value) => {
    setSliderValue(parseFloat(value));
  };

  // Handle slider submission
  const handleSliderSubmit = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Round to one decimal place for storage
    const roundedValue = Math.round(sliderValue * 10) / 10;
    
    const newAnswers = {
      ...answers,
      [currentQuestionData.id]: roundedValue
    };
    setAnswers(newAnswers);
    
    const newProgress = ((currentQuestion + 1) / questions.length) * 100;
    setProgress(newProgress);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setQuestionVisible(false);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200);
      } else {
        setIsTransitioning(false);
        onComplete && onComplete(newAnswers);
      }
    }, 500);
  };

  // Handle text input change
  const handleTextInputChange = (e) => {
    const sanitizedValue = e.target.value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>]/g, ''); // Remove < and > characters
    setTextInput(sanitizedValue);
  };

  // Handle text input submission
  const handleTextInputSubmit = () => {
    if (isTransitioning || !textInput.trim()) return;
    
    setIsTransitioning(true);
    
    const newAnswers = {
      ...answers,
      [currentQuestionData.id]: textInput.trim()
    };
    setAnswers(newAnswers);
    
    const newProgress = 100;
    setProgress(newProgress);
    
    setTimeout(() => {
      setIsTransitioning(false);
      onComplete && onComplete(newAnswers);
    }, 500);
  };

  const currentQuestionData = questions[currentQuestion];

  // Show loading state
  if (persistenceLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center space-y-4">
          <AuraAvatar size={64} />
          <p 
            className="text-lg"
            style={{ color: 'var(--color-muted)' }}
          >
            Loading your progress...
          </p>
        </div>
      </div>
    );
  }

  // Show resume prompt
  if (showResumePrompt) {
    const savedProgress = getProgress();
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter p-6"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4">
            <AuraAvatar size={64} />
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Welcome Back!
            </h2>
            <p 
              className="text-base"
              style={{ color: 'var(--color-muted)' }}
            >
              You're {savedProgress.progressPercentage}% through your assessment. 
              Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="accent"
              size="large"
              onClick={handleResume}
              className="w-full"
            >
              Continue Assessment ({savedProgress.progressPercentage}%)
            </Button>
            
            <Button
              variant="secondary"
              size="large"
              onClick={handleStartFresh}
              className="w-full"
            >
              Start Over
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
                      cardType={currentQuestionData.cardType}
                    />
                  </div>
                </div>

                {/* Choice Options */}
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

                {/* Slider with Extreme Labels */}
                {currentQuestionData.type === 'slider' && (
                  <div className="max-w-2xl mx-auto">
                    <Card className="p-12 space-y-8">
                      {/* Slider */}
                      <div className="space-y-6">
                        <input
                          type="range"
                          min={currentQuestionData.min}
                          max={currentQuestionData.max}
                          step="0.1"
                          value={sliderValue}
                          onChange={(e) => handleSliderChange(e.target.value)}
                          className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((sliderValue - currentQuestionData.min) / (currentQuestionData.max - currentQuestionData.min)) * 100}%, #e2e8f0 ${((sliderValue - currentQuestionData.min) / (currentQuestionData.max - currentQuestionData.min)) * 100}%, #e2e8f0 100%)`
                          }}
                        />
                        
                        {/* Extreme Labels Only */}
                        <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                          <span>{currentQuestionData.extremeLabels.min}</span>
                          <span>{currentQuestionData.extremeLabels.max}</span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="text-center pt-4">
                        <Button
                          variant="accent"
                          size="large"
                          onClick={handleSliderSubmit}
                          disabled={isTransitioning}
                          className="px-12"
                        >
                          {isTransitioning ? 'Loading...' : 'Continue'}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Text Input */}
                {currentQuestionData.type === 'textInput' && (
                  <div className="max-w-2xl mx-auto">
                    <Card className="p-8 space-y-6">
                      <textarea
                        value={textInput}
                        onChange={handleTextInputChange}
                        placeholder={currentQuestionData.placeholder}
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50"
                        style={{
                          backgroundColor: 'var(--color-card)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        disabled={isTransitioning}
                      />
                      
                      <div className="flex justify-between items-center text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span>Share what feels most important right now</span>
                        <span>{textInput.length}/500</span>
                      </div>

                      {/* Submit Button */}
                      <div className="text-center pt-4">
                        <Button
                          variant="accent"
                          size="large"
                          onClick={handleTextInputSubmit}
                          disabled={isTransitioning || !textInput.trim()}
                          className="px-12"
                        >
                          {isTransitioning ? 'Loading...' : 'Complete Assessment'}
                        </Button>
                      </div>
                    </Card>
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