import { ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react'; // Added useEffect

import { AuraProvider } from '../contexts/AuraProvider';
import { supabase } from '../lib/supabase';
import useStore from '../store/store'; // Import Zustand store

import AIMessageCard from './AIMessageCard';
import AuraAvatar from './AuraAvatar';
import Button from './Button';
import Card from './Card';

const DynamicOnboarding = ({ onComplete, onSkip }) => { // onComplete and onSkip props are kept as App.jsx passes them
  const setOnboardingAnswers = useStore((state) => state.setOnboardingAnswers);
  const setCurrentView = useStore((state) => state.setCurrentView);
  // Access existing onboardingAnswers from store to potentially resume
  const existingOnboardingAnswers = useStore((state) => state.onboardingAnswers);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  // Initialize local answers with store's answers if available, for resumption
  const [answers, setAnswers] = useState(existingOnboardingAnswers || {});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  // const [sliderValue, setSliderValue] = useState(3); // Removed as no slider questions in new flow
  const [textInput, setTextInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [coachResponses, setCoachResponses] = useState({}); // To store coach's adaptive responses

  const questions = [
    {
      id: 'mindset',
      type: 'choice',
      message: "Hi there. To get started, let's discover what makes you tick. We call it your Motivational DNA.",
      question: "When it comes to your core abilities, which of these feels closer to your view?",
      cardType: "MINDSET", // Updated cardType
      options: [
        { id: 'A', label: "My abilities can be developed with effort.", value: 'developed' },
        { id: 'B', label: "My abilities are mostly stable.", value: 'stable' }
      ],
      coachResponseLogic: (value) => value === 'developed'
        ? "Excellent. You see skills as something that can be built. That belief in growth is a powerful foundation for everything we'll do together."
        : "Understood. So your view is that our core skills are pretty well set. That's a common perspective, and it gives us a clear starting point. We can focus on leveraging your natural strengths."
    },
    {
      id: 'agency',
      type: 'choice',
      message: "Next, when you think about your successes, which feels more true for you?", // This will be dynamically set based on previous answer
      question: "When you think about your successes, which feels more true for you?",
      cardType: "AGENCY",
      options: [
        { id: 'A', label: "I'm the primary driver of my success.", value: 'primary_driver' },
        { id: 'B', label: "Success is often influenced by external factors.", value: 'external_factors' }
      ],
      coachResponseLogic: (value) => value === 'primary_driver'
        ? "Understood. A strong sense of personal agency. That tells me you're ready to take direct action."
        : "That's a really important insight. Seeing the whole picture—both our own actions and the world around us—is key. We can definitely work with that."
    },
    {
      id: 'motivation_source',
      type: 'choice',
      message: "Now, think about what gets you started on a new project. What's the bigger pull?",
      question: "Now, think about what gets you started on a new project. What's the bigger pull?",
      cardType: "MOTIVATION",
      options: [
        { id: 'A', label: "The internal satisfaction of learning or solving the problem.", value: 'internal_satisfaction' },
        { id: 'B', label: "The external results, like recognition or rewards.", value: 'external_results' }
      ],
      coachResponseLogic: (value) => value === 'internal_satisfaction'
        ? "Good to know. You're fueled by intrinsic motivation—the process itself is the reward. That's a powerful engine for creativity."
        : "That's very clear. You're driven by tangible outcomes. We can use that to set up rewarding goals that keep you energized."
    },
    {
      id: 'approach_to_challenges',
      type: 'choice',
      message: "And when you face a new, complex challenge, what is your typical first impulse?",
      question: "And when you face a new, complex challenge, what is your typical first impulse?",
      cardType: "CHALLENGE APPROACH",
      options: [
        { id: 'A', label: "To start taking action and experimenting.", value: 'action_experimenting' },
        { id: 'B', label: "To step back, analyze, and form a plan first.", value: 'analyze_plan' }
      ],
      coachResponseLogic: (value) => value === 'action_experimenting'
        ? "A bias for action. You learn by doing. We'll make sure your plan has plenty of room for experimentation."
        : "A strategic mindset. You build confidence through planning. We'll focus on creating clear, well-structured paths forward."
    },
    {
      id: 'focus_style',
      type: 'choice',
      message: "Let's talk about focus. When you're working, what's more likely to be true for you?",
      question: "Let's talk about focus. When you're working, what's more likely to be true for you?",
      cardType: "FOCUS STYLE",
      options: [
        { id: 'A', label: "I prefer to dive deep and concentrate on one big thing at a time.", value: 'dive_deep' },
        { id: 'B', label: "I'm comfortable switching between several different tasks or projects.", value: 'comfortable_switching' }
      ],
      coachResponseLogic: (value) => value === 'dive_deep'
        ? "That's great information. You thrive with deep focus. We'll find ways to protect that focus and direct it effectively."
        : "Good to know. You're adaptable and can manage multiple streams of work. We can use that flexibility to make progress on several fronts at once."
    },
    {
      id: 'risk_tolerance',
      type: 'choice',
      message: "Okay, think about a situation where you're facing a choice with an uncertain outcome. Which path sounds more like you?",
      question: "Okay, think about a situation where you're facing a choice with an uncertain outcome. Which path sounds more like you?",
      cardType: "RISK TOLERANCE",
      options: [
        { id: 'A', label: "I prefer the safe, reliable path, even if the reward is smaller.", value: 'safe_reliable' },
        { id: 'B', label: "I'm drawn to the riskier path if it has a bigger potential payoff.", value: 'riskier_payoff' }
      ],
      coachResponseLogic: (value) => value === 'safe_reliable'
        ? "That's great information. You value stability and predictability. We'll focus on building a plan with clear, reliable steps that minimize uncertainty."
        : "Got it. You're energized by big opportunities and comfortable with a degree of risk. We can build a plan that includes high-leverage actions and bold experiments."
    },
    {
      id: 'social_orientation',
      type: 'choice',
      message: "Now, when you think about tackling a major goal, what environment helps you do your best work?",
      question: "Now, when you think about tackling a major goal, what environment helps you do your best work?",
      cardType: "SOCIAL ORIENTATION",
      options: [
        { id: 'A', label: "I do my best thinking and work when I have quiet time to myself.", value: 'quiet_solo' },
        { id: 'B', label: "I get energized and find clarity by talking through ideas with others.", value: 'social_collaborative' }
      ],
      coachResponseLogic: (value) => value === 'quiet_solo'
        ? "That's very clear. You're a \"solo processor\" who thrives on independent focus. We'll make sure your steps are built around that strength."
        : "Excellent. You're a \"social processor\" who gains momentum from collaboration. We can build accountability and partnership right into your plan."
    },
    {
      id: 'goal_category',
      type: 'choice',
      message: "Okay, last part. To make sure we're effective, let's pinpoint your focus. Which area of your life feels most important right now?",
      question: "Which area of your life feels most important right now?",
      options: [
        { id: 'A', label: "Career & Work", value: 'career' },
        { id: 'B', label: "Health & Wellness", value: 'health' },
        { id: 'C', label: "Home & Organization", value: 'home' },
        { id: 'D', label: "Personal Growth", value: 'growth' }
      ]
    },
    {
      id: 'goal_subcategory',
      type: 'choice',
      message: "Got it. When you think about that, what's the first thing that comes to mind?",
      question: "What's the first thing that comes to mind?",
      options: (answers) => { // Options are now a function of previous answers
        switch (answers.goal_category) {
          case 'home':
            return [
              { id: 'A', label: "A cluttered space", value: 'clutter' },
              { id: 'B', label: "Unfinished projects", value: 'projects' },
              { id: 'C', label: "Wasted time", value: 'time' },
            ];
          // Add cases for other categories
          default:
            return [];
        }
      }
    }
  ];

  // Reset input states when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
    // setSliderValue(3); // Removed
    setTextInput('');
    setQuestionVisible(true);
  }, [currentQuestion]);

  const currentQuestionData = questions[currentQuestion];
  const previousQuestionData = currentQuestion > 0 ? questions[currentQuestion -1] : null;

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
  const handleAnswerSelect = async (questionId, answerValue) => { // Make it async
    if (isTransitioning || isLoading) return; // Add isLoading check
    
    setIsTransitioning(true);
    setSelectedAnswer(answerValue);
    
    const newAnswers = {
      ...answers,
      [questionId]: answerValue
    };
    setAnswers(newAnswers);

    // Store coach response for this question
    if (currentQuestionData.coachResponseLogic) {
      const response = currentQuestionData.coachResponseLogic(answerValue);
      setCoachResponses(prev => ({ ...prev, [questionId]: response }));
    }

    // Dynamically generate options for the next question if needed
    if (questions[currentQuestion + 1]?.options && typeof questions[currentQuestion + 1].options === 'function') {
      // Ensure this logic is correctly placed or handled if options depend on the *current* answer
    }
    
    const newProgress = ((currentQuestion + 1) / questions.length) * 100;
    setProgress(newProgress);
    
    console.log('DEBUG: newAnswers in handleAnswerSelect:', newAnswers);
    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        setQuestionVisible(false);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 200); // Short delay for question text to update via coach response
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

  // Slider functionality is removed as per new onboarding flow
  // const handleSliderChange = (value) => {
  //   setSliderValue(parseFloat(value));
  // };

  // const handleSliderSubmit = async () => {
  //   if (isTransitioning || isLoading) return;
    
  //   setIsTransitioning(true);
    
  //   const roundedValue = Math.round(sliderValue * 10) / 10;
    
  //   const newAnswers = {
  //     ...answers,
  //     [currentQuestionData.id]: roundedValue
  //   };
  //   setAnswers(newAnswers);
    
  //   const newProgress = ((currentQuestion + 1) / questions.length) * 100;
  //   setProgress(newProgress);
    
  //   console.log('DEBUG: newAnswers in handleSliderSubmit:', newAnswers);
  //   setTimeout(async () => {
  //     if (currentQuestion < questions.length - 1) {
  //       setQuestionVisible(false);
  //       setTimeout(() => {
  //         setCurrentQuestion(currentQuestion + 1);
  //         setIsTransitioning(false);
  //       }, 200);
  //     } else {
  //       setIsTransitioning(false);
  //       try {
  //         await sendOnboardingDataToWorker(newAnswers);
  //         onComplete && onComplete(newAnswers);
  //       } catch (error) {
  //         console.error("Failed to complete onboarding due to worker error:", error);
  //       }
  //     }
  //   }, 500);
  // };

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

  

  // Determine the message for the AIMessageCard
  // For the first question, it's fixed. For subsequent questions, it's the coach's response to the previous answer.
  const getDisplayMessage = () => {
    if (currentQuestion === 0) {
      return questions[0].message;
    }
    if (previousQuestionData && coachResponses[previousQuestionData.id]) {
      return coachResponses[previousQuestionData.id];
    }
    // Fallback if a coach response isn't available for some reason (should not happen in normal flow)
    return currentQuestionData.message;
  };


  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col font-inter"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Header Section */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pt-6 md:pt-8 pb-2 md:pb-4">
          

          {/* Welcome Text - Updated as per onboard.md */}
          <div className="text-center mb-2 md:mb-4">
            <div className="flex justify-center mb-2">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h1 
              className="text-3xl md:text-4xl font-bold mb-2 md:mb-4 leading-tight max-w-3xl mx-auto"
              style={{ color: 'var(--color-text)' }}
            >
              Discover Your Motivational DNA
            </h1>
            
            <p 
              className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'var(--color-muted)' }}
            >
              Answer a few questions to unlock your personalized coaching plan.
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
                      message={getDisplayMessage()} // Use dynamic message
                      question={currentQuestionData.question}
                      cardType={`COACH (${currentQuestionData.cardType || 'DNA INSIGHT'})`} // More generic cardType or specific
                    />
                  </div>
                </div>

                {/* Choice Options */}
                {currentQuestionData.type === 'choice' && (
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {(typeof currentQuestionData.options === 'function' ? currentQuestionData.options(answers) : currentQuestionData.options).map((option) => (
                      <button
                        key={option.id}
                        type="button"
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
                        {/* Burned-in Letter Background - Kept for styling consistency */}
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
                            {option.id} {/* A, B */}
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
                              {option.label} {/* Display full label directly */}
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
                      </button>
                    ))}
                  </div>
                )}

                {/* Slider with Extreme Labels - Removed as no slider in new flow */}
                {/* {currentQuestionData.type === 'slider' && ( ... )} */}

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