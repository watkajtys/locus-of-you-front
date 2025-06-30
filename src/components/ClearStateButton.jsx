import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { clearAllUserState, emergencyReset, quickLogout } from '../lib/clearUserState';
import Button from './Button';
import Card from './Card';

const ClearStateButton = ({ variant = 'debug' }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearState = async (type = 'full') => {
    setIsClearing(true);
    
    try {
      switch (type) {
        case 'full':
          await clearAllUserState();
          break;
        case 'emergency':
          emergencyReset();
          break;
        case 'quick':
          await quickLogout();
          setIsClearing(false); // Don't reload for quick logout
          break;
        default:
          await clearAllUserState();
      }
    } catch (error) {
      console.error('Error clearing state:', error);
      setIsClearing(false);
    }
  };

  if (variant === 'debug') {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Quick Logout */}
        <button
          onClick={() => handleClearState('quick')}
          disabled={isClearing}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          style={{
            backgroundColor: '#64748b', // slate-500
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            opacity: isClearing ? 0.5 : 1
          }}
          title="Quick logout (preserves onboarding data)"
        >
          <RefreshCw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
          <span>Quick Logout</span>
        </button>

        {/* Clear All State */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isClearing}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          style={{
            backgroundColor: '#dc2626', // red-600
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            opacity: isClearing ? 0.5 : 1
          }}
          title="Clear all user state and reset app"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear State</span>
        </button>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <Card className="max-w-md w-full p-6 space-y-4">
              <div className="text-center space-y-3">
                <AlertTriangle 
                  className="w-12 h-12 mx-auto"
                  style={{ color: '#dc2626' }}
                />
                <h3 
                  className="text-lg font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Clear All User State?
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-muted)' }}
                >
                  This will sign you out, clear all local data, and reset the application. 
                  The page will reload automatically.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowConfirm(false)}
                  disabled={isClearing}
                  className="text-xs"
                >
                  Cancel
                </Button>
                
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowConfirm(false);
                    handleClearState('emergency');
                  }}
                  disabled={isClearing}
                  className="text-xs"
                  style={{
                    backgroundColor: '#f97316',
                    color: 'white'
                  }}
                >
                  Emergency
                </Button>
                
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowConfirm(false);
                    handleClearState('full');
                  }}
                  disabled={isClearing}
                  className="text-xs"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Inline variant for use in components
  return (
    <Button
      variant="secondary"
      size="small"
      onClick={() => handleClearState('quick')}
      disabled={isClearing}
      className="flex items-center space-x-2"
    >
      <Trash2 className="w-4 h-4" />
      <span>{isClearing ? 'Clearing...' : 'Clear State'}</span>
    </Button>
  );
};

export default ClearStateButton;