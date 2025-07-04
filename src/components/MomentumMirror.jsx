import React from 'react';
import { AuraProvider } from '../contexts/AuraProvider';
import useStore from '../store/store';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';

const MomentumMirror = ({ onContinue }) => {
  const momentumMirrorData = useStore((state) => state.momentumMirrorData);

  // Fallback content if data is not available
  const title = momentumMirrorData?.title || "Great work on taking that first step!";
  const body = momentumMirrorData?.body || "Every journey begins with a single action, and you've just proven you can do it. This momentum is exactly what will carry you forward.";

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
            message={title}
            paragraph={body}
            cardType="MOMENTUM MIRROR"
          />

          <div className="text-center pt-6">
            <Button
              variant="accent"
              size="large"
              onClick={onContinue}
              className="px-12 py-4"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default MomentumMirror;