import React, { useState } from 'react';
import { AuraContext, AURA_STATES } from './auraConstants';

// Aura Provider component
export const AuraProvider = ({ children }) => {
  const [auraState, setAuraState] = useState(AURA_STATES.IDLE);

  // Method to update aura state
  const updateAuraState = (newState) => {
    if (Object.values(AURA_STATES).includes(newState)) {
      setAuraState(newState);
    } else {
      console.warn(`Invalid aura state: ${newState}`);
    }
  };

  // Method to reset to idle state
  const resetAura = () => {
    setAuraState(AURA_STATES.IDLE);
  };

  // Method to set processing state
  const setProcessing = () => {
    setAuraState(AURA_STATES.PROCESSING);
  };

  // Method to set success state
  const setSuccess = () => {
    setAuraState(AURA_STATES.SUCCESS);
  };

  // Method to set error state
  const setError = () => {
    setAuraState(AURA_STATES.ERROR);
  };

  const contextValue = {
    auraState,
    updateAuraState,
    resetAura,
    setProcessing,
    setSuccess,
    setError,
    // Convenience getters
    isIdle: auraState === AURA_STATES.IDLE,
    isProcessing: auraState === AURA_STATES.PROCESSING,
    isSuccess: auraState === AURA_STATES.SUCCESS,
    isError: auraState === AURA_STATES.ERROR
  };

  return (
    <AuraContext.Provider value={contextValue}>
      {children}
    </AuraContext.Provider>
  );
};