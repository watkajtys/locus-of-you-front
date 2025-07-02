import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, User, LogIn, Zap } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Card from './Card';
import Button from './Button';
import boltBadge from '../assets/bolt-badge.png';

const DynamicOnboarding = ({ onComplete, onSkip }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [sliderValue, setSliderValue] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  
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

  // New function to send onboarding data to the Cloudflare Worker
  const sendOnboardingDataToWorker = async (onboardingAnswers) => {
    setIsLoading(true);
    try {
      console.log('DEBUG: onboardingAnswers received by sendOnboardingDataToWorker:', onboardingAnswers); // NEW LINE
      let userId;
      let accessToken = null;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const session = await supabase.auth.getSession();
        accessToken = session.data.session?.access_token;
      } else {
        // Generate an anonymous ID if no user is authenticated
        userId = localStorage.getItem('anonymous_onboarding_id');
        if (!userId) {
          userId = `anon_onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('anonymous_onboarding_id', userId);
        }
      }

      const workerApiUrl = import.meta.env.VITE_WORKER_API_URL;
      if (!workerApiUrl) {
        throw new Error('VITE_WORKER_API_URL is not defined in environment variables.');
      }

      // Add userId to onboardingAnswers before sending to worker and before onComplete
      onboardingAnswers.userId = userId;

      const payload = {
        userId: userId,
        sessionId: `onboarding_${userId}_${Date.now()}`, // Unique session ID for onboarding
        context: {
          sessionType: 'onboarding_diagnostic',
          onboardingAnswers: onboardingAnswers // Send all collected answers
        },
        message: "Onboarding assessment completed." // A generic message for the worker
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      console.log('Sending onboarding payload to worker:', payload); // Add this line
      const response = await fetch(`${workerApiUrl}/api/coaching/message`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send onboarding data to worker.');
      }

      const result = await response.json();
      console.log('Onboarding data sent to worker successfully:', result);
      return result;

    } catch (error) {
      console.error('Error sending onboarding data to worker:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle choice answer selection
  const handleAnswerSelect = async (questionId, answerValue, optionData) => { // Make it async
    if (isTransitioning || isLoading) return; // Add isLoading check
    
    setIsTransitioning(true);
    setSelectedAnswer(answerValue);
    
    const newAnswers = {
      ...answers,
      [questionId]: answerValue
    };
    setAnswers(newAnswers);
    
    const newProgress = ((currentQuestion + 1) / questions.length) * 100;
    setProgress(newProgress);
    
    console.log('DEBUG: newAnswers in handleAnswerSelect:', newAnswers); // NEW LINE
    setTimeout(async () => { // Make inner function async // Make inner function async
      if (currentQuestion < questions.length - 1) {
        setQuestionVisible(false);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200);
      } else {
        setIsTransitioning(false);
        try {
          await sendOnboardingDataToWorker(newAnswers);
          onComplete && onComplete(newAnswers);
        } catch (error) {
          console.error("Failed to complete onboarding due to worker error:", error);
          // Optionally, show an error message to the user
        }
      }
    }, 500);
  };

  // Handle fluid slider input
  const handleSliderChange = (value) => {
    setSliderValue(parseFloat(value));
  };

  // Handle slider submission
  const handleSliderSubmit = async () => { // Make it async
    if (isTransitioning || isLoading) return; // Add isLoading check
    
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
    
    console.log('DEBUG: newAnswers in handleSliderSubmit:', newAnswers); // NEW LINE
    setTimeout(async () => { // Make inner function async
      if (currentQuestion < questions.length - 1) {
        setQuestionVisible(false);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200);
      } else {
        setIsTransitioning(false);
        try {
          await sendOnboardingDataToWorker(newAnswers);
          onComplete && onComplete(newAnswers);
        } catch (error) {
          console.error("Failed to complete onboarding due to worker error:", error);
        }
      }
    }, 500);
  };

  // Handle text input change
  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  // Handle text input submission
  const handleTextInputSubmit = async () => { // Make it async
    if (isTransitioning || isLoading || !textInput.trim()) return; // Add isLoading check
    
    setIsTransitioning(true);
    
    const newAnswers = {
      ...answers,
      [currentQuestionData.id]: textInput.trim()
    };
    setAnswers(newAnswers);
    
    const newProgress = 100;
    setProgress(newProgress);
    
    console.log('DEBUG: newAnswers in handleTextInputSubmit:', newAnswers); // NEW LINE
    setTimeout(async () => { // Make inner function async
      setIsTransitioning(false);
      try {
        await sendOnboardingDataToWorker(newAnswers);
        onComplete && onComplete(newAnswers);
      } catch (error) {
        console.error("Failed to complete onboarding due to worker error:", error);
      }
    }, 500);
  };

  // Handle Log In button click
  const handleLogIn = () => {
    // Call onSkip to trigger showing the auth screen
    onSkip && onSkip();
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
          {/* Bolt Badge */}
          <div className="absolute top-4 right-4 z-50">
            <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
              <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" />
            </a>
          </div>

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
                          disabled={isTransitioning || isLoading} // Disable button when loading
                          className="px-12"
                        >
                          {isTransitioning || isLoading ? 'Processing...' : 'Continue'} {/* Update button text */}
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
                        className="w-full px-4 py-3 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50"
                        style={{
                          backgroundColor: 'var(--color-card)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        disabled={isTransitioning || isLoading} // Disable textarea when loading
                      />

                      {/* Submit Button */}
                      <div className="text-center pt-4">
                        <Button
                          variant="accent"
                          size="large"
                          onClick={handleTextInputSubmit}
                          disabled={isTransitioning || isLoading || !textInput.trim()} // Disable button when loading
                          className="px-12"
                        >
                          {isTransitioning || isLoading ? 'Processing...' : 'Complete Assessment'} {/* Update button text */}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div 
          className="flex-shrink-0 border-t backdrop-blur-sm"
          style={{ 
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            opacity: '0.98'
          }}
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/*<div className="flex items-center justify-between space-x-4">*/}
            {/*  /!* Secondary - Skip for Now Button *!/*/}
            {/*  <button*/}
            {/*    onClick={onSkip}*/}
            {/*    disabled={isTransitioning || isLoading} // Disable button when loading*/}
            {/*    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"*/}
            {/*    style={{*/}
            {/*      backgroundColor: 'var(--color-primary)',*/}
            {/*      borderColor: 'var(--color-border)',*/}
            {/*      color: 'var(--color-muted)',*/}
            {/*      border: '1px solid var(--color-border)'*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <span className="text-sm font-medium">Skip for Now</span>*/}
            {/*  </button>*/}

            {/*  /!* Primary - Log In Button *!/*/}
            {/*  <button*/}
            {/*    onClick={handleLogIn}*/}
            {/*    disabled={isTransitioning || isLoading} // Disable button when loading*/}
            {/*    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"*/}
            {/*    style={{*/}
            {/*      backgroundColor: 'var(--color-accent)',*/}
            {/*      color: 'white',*/}
            {/*      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <LogIn className="w-5 h-5" />*/}
            {/*    <span className="text-sm font-semibold">Log In</span>*/}
            {/*  </button>*/}
            {/*</div>*/}

            {/* Help Text */}
            <div className="text-center mt-3">
              <p 
                className="text-xs"
                style={{ color: 'var(--color-muted)' }}
              >
                Already have an account? Log in to continue where you left off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default DynamicOnboarding;