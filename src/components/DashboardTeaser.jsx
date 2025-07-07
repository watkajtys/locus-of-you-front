import React from 'react';
import { AuraProvider } from '../contexts/AuraProvider';
import useStore from '../store/store';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Button from './Button';
import DashboardHeader from './DashboardHeader';
import CumulativeGraph from './CumulativeGraph';

const DashboardTeaser = ({ onBuildPlan }) => {
  const dashboardTeaserData = useStore((state) => state.dashboardTeaserData);

  if (!dashboardTeaserData) {
    return (
      <AuraProvider>
        <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
          <div className="max-w-2xl mx-auto w-full space-y-8 text-center">
            <p className="text-lg" style={{ color: 'var(--color-text)' }}>
              Loading your dashboard preview...
            </p>
          </div>
        </div>
      </AuraProvider>
    );
  }

  return (
    <AuraProvider>
      <div className="min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {/* Header with avatar and teaser message */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={64} className="hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <AIMessageCard
            paragraph={dashboardTeaserData.teaserText}
            question="Here's a preview of your premium dashboard:"
            cardType="DASHBOARD PREVIEW"
          />

          {/* Greyed-out Dashboard Preview */}
          <div className="relative">
            {/* Overlay for greyed-out effect */}
            <div className="absolute inset-0 bg-gray-500 bg-opacity-60 z-10 rounded-xl pointer-events-none"></div>
            
            {/* Dashboard Content */}
            <div className="space-y-6 p-6 rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              {/* Dashboard Header with greyed-out effect */}
              <div className="opacity-50">
                <DashboardHeader 
                  dailyStreak={7}
                  weeklyProgress={0.75}
                  totalWins={23}
                />
              </div>

              {/* Cumulative Graph with greyed-out effect */}
              <div className="opacity-50">
                <CumulativeGraph />
              </div>
            </div>

            {/* Center overlay with call to action */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white rounded-xl p-8 shadow-2xl border-2 border-orange-500 text-center max-w-md mx-4">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Unlock Your Full Dashboard
                </h3>
                <p className="text-gray-600 mb-6">
                  See your progress, track your wins, and get personalized insights to accelerate your growth.
                </p>
                <Button
                  variant="accent"
                  size="large"
                  onClick={onBuildPlan}
                  className="w-full text-lg font-semibold shadow-lg"
                  style={{
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Build My Plan
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom teaser text */}
          <div className="text-center">
            <p className="text-sm opacity-75" style={{ color: 'var(--color-muted)' }}>
              This is just a glimpse of what awaits you with a premium subscription.
            </p>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default DashboardTeaser;