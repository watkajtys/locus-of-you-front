import React, { useState } from 'react';
import { MessageCircle, BarChart3, User } from 'lucide-react';
// We don't need to import useStore here if AppShell itself doesn't use store values directly.
// Child components will import and use the store.
import CoachingInterface from './CoachingInterface';
import Dashboard from './Dashboard';
import Account from './Account';


const AppShell = () => { // Removed session and hasSubscription props
  const [activeTab, setActiveTab] = useState('coach');

  const tabs = [
    {
      id: 'coach',
      label: 'Coach',
      icon: MessageCircle,
      component: CoachingInterface
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: Dashboard
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      component: Account
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div 
        className="min-h-screen flex flex-col font-inter relative"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* ActiveComponent will now fetch its own data from the store if needed */}
        {ActiveComponent && <ActiveComponent />}
      </div>

      {/* Bottom Tab Navigation */}
      <nav 
        className="flex-shrink-0 border-t backdrop-blur-sm"
        style={{ 
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          opacity: '0.95'
        }}
      >
        <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center space-y-1 px-4 py-3 rounded-lg
                  transition-all duration-300 ease-in-out
                  min-w-0 flex-1
                  ${isActive 
                    ? 'transform scale-105' 
                    : 'hover:scale-102 opacity-70 hover:opacity-100'
                  }
                `}
                style={{
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                }}
              >
                <IconComponent 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? 'animate-bounce' : ''
                  }`}
                  style={{ 
                    color: isActive ? 'var(--color-accent)' : 'var(--color-muted)'
                  }}
                />
                <span 
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isActive ? 'font-semibold' : ''
                  }`}
                  style={{ 
                    color: isActive ? 'var(--color-accent)' : 'var(--color-muted)'
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;