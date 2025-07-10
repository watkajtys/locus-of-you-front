import { createContext, useContext } from 'react';

export const AuraContext = createContext();

export const useAura = () => {
  const context = useContext(AuraContext);
  if (!context) {
    throw new Error('useAura must be used within an AuraProvider');
  }
  return context;
};

export const AURA_STATES = {
  IDLE: 'IDLE', // Changed to uppercase to match ThreeJSAura
  PROCESSING: 'PROCESSING', // Changed to uppercase
  SUCCESS: 'SUCCESS', // Changed to uppercase
  ERROR: 'ERROR', // Changed to uppercase
  SLEEP: 'SLEEP',
  LISTENING: 'LISTENING',
  RECEIVED: 'RECEIVED',
  OPEN: 'OPEN', // Added for plate animation control
  CLOSE: 'CLOSE' // Added for plate animation control
};