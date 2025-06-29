import React from 'react';
import { useAura, AURA_STATES } from '../contexts/AuraProvider';

const AuraAvatar = ({ size = 128, className = '' }) => {
  const { auraState } = useAura();

  // Map aura states to animation durations
  const getAnimationDuration = (state) => {
    switch (state) {
      case AURA_STATES.IDLE:
        return '15s';
      case AURA_STATES.PROCESSING:
        return '5s';
      case AURA_STATES.SUCCESS:
        return '8s';
      case AURA_STATES.ERROR:
        return '3s';
      default:
        return '15s';
    }
  };

  // Get additional state-specific styles
  const getStateStyles = (state) => {
    const baseStyles = {
      '--aura-animation-duration': getAnimationDuration(state),
      '--aura-size': `${size}px`
    };

    // Add state-specific color variations
    switch (state) {
      case AURA_STATES.SUCCESS:
        return {
          ...baseStyles,
          '--aura-color-1': '#10b981', // emerald-500
          '--aura-color-2': '#d1fae5', // emerald-100
          '--aura-color-3': '#6ee7b7'  // emerald-300
        };
      case AURA_STATES.ERROR:
        return {
          ...baseStyles,
          '--aura-color-1': '#ef4444', // red-500
          '--aura-color-2': '#fee2e2', // red-100
          '--aura-color-3': '#fca5a5'  // red-300
        };
      case AURA_STATES.PROCESSING:
        return {
          ...baseStyles,
          '--aura-color-1': '#8b5cf6', // violet-500
          '--aura-color-2': '#ede9fe', // violet-100
          '--aura-color-3': '#c4b5fd'  // violet-300
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div
      className={`aura-circle ${className}`}
      style={getStateStyles(auraState)}
      role="img"
      aria-label={`Aura avatar in ${auraState} state`}
    >
      {/* Optional: Add content inside the circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-1/3 h-1/3 rounded-full opacity-60"
          style={{ 
            backgroundColor: 'var(--color-background)',
            backdropFilter: 'blur(8px)'
          }}
        />
      </div>
    </div>
  );
};

export default AuraAvatar;