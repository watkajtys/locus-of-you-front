import React, { useState } from 'react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import Card from './Card'; // For styling options if needed
import boltBadge from '../assets/bolt-badge.png'; // Assuming this is used consistently

const ReflectionScreen = ({ task, onComplete, userName }) => {
  const [reflectionMade, setReflectionMade] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  const reflectionOptions = [
    { id: 'easy', text: 'I did it. It felt surprisingly easy.' },
    { id: 'silly', text: 'I did it, but it felt a bit silly.' },
    { id: 'not_done', text: 'I didn\'t get around to it.' },
    { id: 'something_else', text: 'Something else came up.' },
  ];

  const handleOptionSelect = (optionText) => {
    setSelectedOption(optionText); // You might want to store the actual selection value
    setReflectionMade(true);
    // Here you could also send the reflection data to a backend/worker if needed
    console.log(`User reflection on task "${task}": ${optionText}`);
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
        {/* Bolt Badge */}
        <div className="absolute top-4 right-4 z-50">
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
            <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" />
          </a>
        </div>

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
              <Card className="p-6 md:p-8">
                <div className="space-y-4">
                  {reflectionOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline" // Or another appropriate variant
                      size="large"
                      onClick={() => handleOptionSelect(option.text)}
                      className="w-full text-left justify-start py-4"
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>
              </Card>
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
