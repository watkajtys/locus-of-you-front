import React from 'react';
import { useTheme } from '../hooks/useTheme';
import DashboardHeader from './DashboardHeader';
import CumulativeGraph from './CumulativeGraph';
import Card from './Card';
import { Brain, Target, TrendingUp, Calendar, Award, Zap } from 'lucide-react';

const Dashboard = ({ session, hasSubscription = false }) => {
  const { theme } = useTheme();

  // Sample data for dashboard
  const recentWins = [
    { id: 1, title: 'Completed morning routine', date: '2025-01-26', category: 'Habits' },
    { id: 2, title: 'Finished project milestone', date: '2025-01-25', category: 'Work' },
    { id: 3, title: 'Meditated for 10 minutes', date: '2025-01-25', category: 'Wellness' },
    { id: 4, title: 'Reached out to a friend', date: '2025-01-24', category: 'Social' }
  ];

  const insights = [
    {
      icon: Brain,
      title: 'Your Pattern',
      description: 'You\'re most productive in the morning hours. Consider scheduling important tasks before 11 AM.',
      color: 'var(--color-accent)'
    },
    {
      icon: Target,
      title: 'Focus Area',
      description: 'Building consistency in your morning routine is showing great results. Keep it up!',
      color: 'var(--color-primary)'
    },
    {
      icon: TrendingUp,
      title: 'Growth Trend',
      description: 'Your goal completion rate has improved by 40% over the past month.',
      color: '#10b981'
    }
  ];

  return (
    <div 
      className="min-h-screen font-inter"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header Stats */}
      <div className="px-4 py-6">
        <DashboardHeader 
          dailyStreak={12}
          weeklyProgress={0.75}
          totalWins={45}
        />
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-6">
        {/* Growth Chart */}
        <CumulativeGraph />

        {/* Insights Grid */}
        <div className="space-y-4">
          <h3 
            className="text-xl font-bold px-2"
            style={{ color: 'var(--color-text)' }}
          >
            Insights & Patterns
          </h3>
          <div className="grid gap-4">
            {insights.map((insight, index) => {
              const IconComponent = insight.icon;
              return (
                <Card key={index} className="p-6" hover>
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: insight.color }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 
                        className="font-semibold text-lg"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {insight.title}
                      </h4>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Wins */}
        <div className="space-y-4">
          <h3 
            className="text-xl font-bold px-2"
            style={{ color: 'var(--color-text)' }}
          >
            Recent Wins
          </h3>
          <Card className="p-6">
            <div className="space-y-4">
              {recentWins.map((win) => (
                <div key={win.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-opacity-50 transition-colors duration-200" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 
                      className="font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {win.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                      <Calendar className="w-4 h-4" />
                      <span>{win.date}</span>
                      <span>•</span>
                      <span>{win.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Padding for Navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Dashboard;