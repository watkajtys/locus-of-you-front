import React from 'react';

import { AuraProvider } from '../contexts/AuraProvider';
import useStore from '../store/store';

import AIMessageCard from './AIMessageCard';
import AuraAvatar from './AuraAvatar';
import Button from './Button';

const MomentumMirror = ({ onContinue }) => {
  const momentumMirrorData = useStore((state) => state.momentumMirrorData);

  if (!momentumMirrorData) {
    return (
      <AuraProvider>
        <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
          <div className="max-w-2xl mx-auto w-full space-y-8 text-center">
            <p className="text-lg" style={{ color: 'var(--color-text)' }}>
              Loading your momentum update...
            </p>
          </div>
        </div>
      </AuraProvider>
    );
  }

  return (
    <AuraProvider>
      <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <AIMessageCard
            question={momentumMirrorData.title}
            paragraph={momentumMirrorData.body}
            cardType="MOMENTUM MIRROR"
            className="animate-pulse-subtle"
          />

          <div className="text-center pt-6">
            <Button
              variant="accent"
              size="large"
              onClick={onContinue}
              className="px-12 py-4 animate-bounce-subtle"
            >
              See What's Next
            </Button>
          </div>
        </div>
      </div>

      
    </AuraProvider>
  );
};

export default MomentumMirror;