import React, { useState } from 'react';

import { AuraContext, AURA_STATES } from './auraConstants';

// Aura Provider component
export const AuraProvider = ({ children }) => {
  const [auraState, setAuraState] = useState(AURA_STATES.SLEEP); // Default back to SLEEP for wake up sequence

  // Method to update aura state
  const updateAuraState = (newState) => {
    if (Object.values(AURA_STATES).includes(newState)) {
      setAuraState(newState);
    } else {
      console.warn(`Invalid aura state: ${newState}`);
    }
  };

  // Method to reset to idle state (now SLEEP is the default idle)
  const resetAura = () => {
    setAuraState(AURA_STATES.SLEEP);
  };

  // Existing methods
  const setProcessing = () => {
    setAuraState(AURA_STATES.PROCESSING);
  };
  const setSuccess = () => {
    setAuraState(AURA_STATES.SUCCESS);
  };
  const setError = () => {
    setAuraState(AURA_STATES.ERROR);
  };
  const setIdle = () => { // Explicitly set IDLE (which is different from SLEEP)
    setAuraState(AURA_STATES.IDLE);
  };

  // New methods for additional states
  const setSleep = () => {
    setAuraState(AURA_STATES.SLEEP);
  };
  const setListening = () => {
    setAuraState(AURA_STATES.LISTENING);
  };
  const setReceived = () => {
    setAuraState(AURA_STATES.RECEIVED);
  };
  const setOpen = () => { // For plate animation
    setAuraState(AURA_STATES.OPEN);
  };
  const setClose = () => { // For plate animation
    setAuraState(AURA_STATES.CLOSE);
  };


  const contextValue = {
    auraState,
    updateAuraState,
    resetAura, // Resets to SLEEP
    setIdle, // Sets to active IDLE
    setProcessing,
    setSuccess,
    setError,
    setSleep,
    setListening,
    setReceived,
    setOpen,
    setClose,
    // Convenience getters
    isIdle: auraState === AURA_STATES.IDLE,
    isProcessing: auraState === AURA_STATES.PROCESSING,
    isSuccess: auraState === AURA_STATES.SUCCESS,
    isError: auraState === AURA_STATES.ERROR,
    isSleep: auraState === AURA_STATES.SLEEP,
    isListening: auraState === AURA_STATES.LISTENING,
    isReceived: auraState === AURA_STATES.RECEIVED,
    isOpen: auraState === AURA_STATES.OPEN,
    isClosed: auraState === AURA_STATES.CLOSE,
  };

  return (
    <AuraContext.Provider value={contextValue}>
      {children}
    </AuraContext.Provider>
  );
};