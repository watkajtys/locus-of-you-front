import React from 'react';
import { AuraProvider } from '../contexts/AuraProvider';
import useStore from '../store/store';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import DashboardHeader from './DashboardHeader';
import CumulativeGraph from './CumulativeGraph';
import Card from './Card';

const DashboardTeaser = ({ onContinue }) => {
  const dashboardTeaserData = useStore((state) => state.dashboardTeaserData);

  // Fallback content if data is not available
  const teaser = dashboardTeaserData?.teaser || "Here's a preview of your personalized dashboard where you'll track your progress and see how each small step builds into meaningful change.";

  return (
    <AuraProvider>
      <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <AIMessageCard
            message={teaser}
            cardType="PREVIEW"
          />

          {/* Dashboard Preview - Greyed out and non-interactive */}
          <Card className="relative p-6 md:p-8 overflow-hidden">
            {/* Overlay to make it non-interactive and greyed out */}
            <div className="absolute inset-0 bg-gray-200 bg-opacity-60 z-10 backdrop-blur-sm">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div 
                    className="text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--color-accent)', 
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    Premium Feature Preview
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="space-y-6 opacity-70">
              <div className="text-center">
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Your Progress Dashboard
                </h2>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Track your journey and celebrate every win
                </p>
              </div>

              {/* Mock Dashboard Header */}
              <DashboardHeader 
                dailyStreak={3}
                weeklyProgress={0.6}
                totalWins={8}
              />

              {/* Mock Cumulative Graph */}
              <CumulativeGraph />

              {/* Mock Recent Activities */}
              <Card className="p-4">
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--color-text)' }}
                >
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Completed first step task</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--color-muted)' }}>Today</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Reflected on progress</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--color-muted)' }}>Today</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Started goal journey</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--color-muted)' }}>Yesterday</span>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          <div className="text-center pt-6">
            <Button
              variant="accent"
              size="large"
              onClick={onContinue}
              className="px-12 py-4"
            >
              Build My Plan
            </Button>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default DashboardTeaser;