import React, { useState } from 'react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import Card from './Card'; // For styling options if needed


const ReflectionScreen = ({ task, onComplete, userName, userId }) => {
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

  const sendReflectionToBackend = async (reflectionOption) => {
    if (!userId) {
      console.error('User ID is missing, cannot send reflection.');
      setError('User ID is missing. Cannot save reflection.'); // Show error to user
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        userId: userId,
        message: reflectionOption.text, // The user's selected reflection text
        context: {
          sessionType: 'reflection',
          previousTask: task || 'Unknown task', // The ISFS task they reflected on
          reflectionId: reflectionOption.id, // e.g., 'easy', 'silly'
          // You could also include the full onboardingAnswers here if the backend needs more context
          // onboardingAnswers: onboardingAnswers,
        }
      };

      console.log("Sending reflection payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${import.meta.env.VITE_WORKER_API_URL}/api/coaching/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log('Reflection sent successfully:', responseData);
      // No need to call onComplete here, it's handled by the "Are you ready for your next step?" button
    } catch (err) {
      console.error('Failed to send reflection:', err);
      setError(err.message || 'Failed to send reflection. Please try again.');
      // Do not proceed if sending reflection fails, allow user to see error.
      // Potentially allow retry or inform user to contact support.
      // For now, we'll just show the error and not setReflectionMade(true)
      setIsLoading(false);
      return; // Important: stop execution here
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
      <div
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        

        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {!reflectionMade ? (
            <>
              <AIMessageCard
                message={coachQuestion}
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
                      variant="outline" // Or another appropriate variant
                      size="large"
                       onClick={() => handleOptionSelect(option)} // Pass the whole option object
                      className="w-full text-left justify-start py-4"
                      disabled={isLoading}
                    >
                      {isLoading && selectedOption === option.text ? 'Sending...' : option.text}
                    </Button>
                  ))}
                </div>
              </Card>
              {isLoading && !selectedOption && ( // General loading indicator if not specific to a button
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
                  onClick={onComplete} // This will trigger transition to Paywall
                  className="px-12 py-4"
                >
                  Are you ready for your next step?
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AuraProvider>
  );
};

export default ReflectionScreen;
