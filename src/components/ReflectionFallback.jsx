import React, { useEffect } from 'react';

import useStore from '../store/store';

import Button from './Button';

const ReflectionFallback = () => {
  const setCurrentView = useStore((state) => state.setCurrentView);

  useEffect(() => {
    setCurrentView('firstStep');
  }, [setCurrentView]);

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
};

export default ReflectionFallback;
