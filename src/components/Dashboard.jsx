import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import Header from './Header';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import Card from './Card';

const Dashboard = ({ session }) => {
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuraProvider>
      <div 
        className="min-h-screen font-inter transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <Header theme={theme} onThemeToggle={toggleTheme} />
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Welcome Section */}
            <Card className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Dashboard
                  </h1>
                  <p 
                    className="text-lg"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Welcome back, {session?.user?.email}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <AuraAvatar size={64} />
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Placeholder Content */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="space-y-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Profile
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Manage your account settings and preferences.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-3">
                  <AuraAvatar size={40} />
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Aura Status
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Your digital aura is currently in idle state.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                  </div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Activities
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    View your recent activities and interactions.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuraProvider>
  );
};

export default Dashboard;