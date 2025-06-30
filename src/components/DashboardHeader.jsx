import React from 'react';
import { Flame, Star, Target } from 'lucide-react';
import Card from './Card';

const DashboardHeader = ({ dailyStreak, weeklyProgress, totalWins }) => {
  // Calculate circle progress for weekly goal
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - weeklyProgress);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Daily Streak */}
      <Card className="p-6 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#f97316' }}
            >
              <Flame className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              {dailyStreak}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              Day Streak
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Progress Ring */}
      <Card className="p-6 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="relative w-12 h-12">
              {/* Background circle */}
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="var(--color-border)"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="var(--color-accent)"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target 
                  className="w-5 h-5"
                  style={{ color: 'var(--color-accent)' }}
                />
              </div>
            </div>
          </div>
          <div>
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              {Math.round(weeklyProgress * 100)}%
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              Weekly Goal
            </div>
          </div>
        </div>
      </Card>

      {/* Total Wins */}
      <Card className="p-6 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#10b981' }}
            >
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              {totalWins}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              Total Wins
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardHeader;