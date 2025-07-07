import React, { useState, useEffect } from 'react'; // Added useEffect
import { supabase } from '../lib/supabase'; // Import supabase
import { AuraProvider } from '../contexts/AuraProvider';
import useStore from '../store/store'; // Import Zustand store
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import Card from './Card';


const ReflectionScreen = ({ onComplete }) => { // Removed task, userName, userId props
  const currentIsfsTask = useStore((state) => state.currentIsfsTask);
  const onboardingAnswers = useStore((state) => state.onboardingAnswers);
  const session = useStore((state) => state.session);
  const setCurrentView = useStore((state) => state.setCurrentView); // For fallback
  const setMomentumMirrorData = useStore((state) => state.setMomentumMirrorData);
  const setDashboardTeaserData = useStore((state) => state.setDashboardTeaserData);
  const setCurrentIsfsTask = useStore((state) => state.setCurrentIsfsTask);

  const [reflectionMade, setReflectionMade] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const reflectionOptions = [
    { id: 'easy', text: 'I did it. It felt surprisingly easy.' },
    { id: 'silly', text: 'I did it, but it felt a bit silly.' },
    { id: 'not_done', text: 'I didn\'t get around to it.' },
    { id: 'something_else', text: 'Something else came up.' },
  ];

  const getUserIdForApi = () => {
    if (session?.user?.id) return session.user.id;
    if (onboardingAnswers?.userId) return onboardingAnswers.userId;
    let anonId = localStorage.getItem('anonymous_reflection_id_fallback'); // Use a distinct key
    if (!anonId) {
        anonId = `anon_reflect_fb_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
        localStorage.setItem('anonymous_reflection_id_fallback', anonId);
    }
    return anonId;
  };

  const sendReflectionToBackend = async (reflectionOption) => {
    const userIdToUse = getUserIdForApi();
    if (!userIdToUse) { // Should be redundant due to getUserIdForApi always returning something
      console.error('User ID is missing, cannot send reflection.');
      setError('User ID is missing. Cannot save reflection.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        userId: userIdToUse,
        message: reflectionOption.text,
        context: {
          sessionType: 'reflection',
          previousTask: currentIsfsTask || localStorage.getItem('lastActiveIsfsTask') || 'Unknown task',
          reflectionId: reflectionOption.id,
          onboardingAnswers: onboardingAnswers, // Include onboarding answers for more context
        }
      };

      console.log("Sending reflection payload:", JSON.stringify(payload, null, 2));

      let accessToken = null;
      if (session?.access_token) {
          accessToken = session.access_token;
      } else if (session?.user) {
          const { data: newSessionData } = await supabase.auth.getSession();
          accessToken = newSessionData?.session?.access_token;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await fetch(`${import.meta.env.VITE_WORKER_API_URL}/api/coaching/message`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred during reflection submission.' }));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log('Reflection sent successfully:', responseData);
      
      // Store the new momentum mirror and dashboard teaser data from backend response
      if (responseData.data?.momentumMirror) {
        setMomentumMirrorData(responseData.data.momentumMirror);
      }
      if (responseData.data?.dashboardTeaser) {
        setDashboardTeaserData(responseData.data.dashboardTeaser);
      }
      if (responseData.data?.nextAdaptedTask) {
        setCurrentIsfsTask(responseData.data.nextAdaptedTask.task);
      }
    } catch (err) {
      console.error('Failed to send reflection:', err);
      setError(err.message || 'Failed to send reflection. Please try again.');
      setIsLoading(false); // Ensure loading is stopped on error
      return; // Stop execution here if reflection failed
    }
    setIsLoading(false);
    setReflectionMade(true); // Only set if API call was successful
  };


  const handleOptionSelect = (option) => { // Pass the whole option object
    setSelectedOption(option.text); // Keep UI state with text for button loading indicator
    sendReflectionToBackend(option); // Send the whole option object
    // setReflectionMade(true) is now called within sendReflectionToBackend upon success
  };

  // Determine the dynamic question including the task
  const coachQuestion = task
    ? `Welcome back${userName ? ', ' + userName : ''}. How did it go with "${task}"?`
    : `Welcome back${userName ? ', ' + userName : ''}. How did your first step go?`; // Fallback if task is not provided

  return (
    <AuraProvider>
      <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {!reflectionMade ? (
            <>
              <AIMessageCard
                message={
                  (currentIsfsTask || localStorage.getItem('lastActiveIsfsTask'))
                    ? `Welcome back${onboardingAnswers?.name ? ', ' + onboardingAnswers.name : ''}. How did it go with "${currentIsfsTask || localStorage.getItem('lastActiveIsfsTask')}"?`
                    : `Welcome back${onboardingAnswers?.name ? ', ' + onboardingAnswers.name : ''}. How did your first step go?`
                }
                cardType="COACH REFLECTION"
              />
              {error && (
                <Card className="p-4 md:p-6 bg-red-50 border-red-200">
                  <p className="text-red-700 text-center">{error}</p>
                </Card>
              )}
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  {reflectionOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="large"
                      onClick={() => handleOptionSelect(option)}
                      className="w-full text-left justify-start py-4"
                      disabled={isLoading}
                    >
                      {isLoading && selectedOption === option.text ? 'Sending...' : option.text}
                    </Button>
                  ))}
                </div>
              </Card>
              {isLoading && !selectedOption && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Sending reflection...</p>
                </div>
              )}
            </>
          ) : (
            <>
              <AIMessageCard
                message="Thanks for sharing that. That's useful information, and it helps me know what to suggest next."
                paragraph="Taking these small, consistent steps is the key to building real momentum."
                cardType="COACH FEEDBACK"
              />
              <div className="text-center pt-6">
                <Button
                  variant="accent"
                  size="large"
                  onClick={() => setCurrentView('momentumMirror')}
                  className="px-12 py-4"
                >
                  See Your Momentum
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AuraProvider>
  );

  // Fallback UI if task is missing (should ideally be prevented by App.jsx's view logic)
  if (!currentIsfsTask && !localStorage.getItem('lastActiveIsfsTask')) {
    useEffect(() => {
        if (currentView !== 'firstStep') setCurrentView('firstStep');
    }, [setCurrentView]); // currentView removed from dep array

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
            <p className="text-lg mb-4" style={{ color: 'var(--color-text)' }}>
                No task found to reflect upon. Please complete a first step.
            </p>
            <Button onClick={() => setCurrentView('firstStep')} variant="primary">
                Go to First Step
            </Button>
        </div>
    );
  }
};

export default ReflectionScreen;
