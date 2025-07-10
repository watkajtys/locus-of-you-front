import React, { useEffect } from 'react';
import { useAura, AURA_STATES } from '../contexts/auraConstants';
import ThreeJSAura from './ThreeJSAura';

const AuraAvatar = ({ size = 128, className = '' }) => {
  const { auraState, updateAuraState, isSleep } = useAura();

  useEffect(() => {
    // If the initial state is SLEEP, transition to IDLE after a delay
    if (isSleep) {
      const timer = setTimeout(() => {
        updateAuraState(AURA_STATES.IDLE);
      }, 1500); // 1.5 second delay

      return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
    }
  }, [isSleep, updateAuraState]); // Depend on isSleep to run only when it changes to/from true

  return (
    <div
      className={`aura-container ${className}`} // Use a more generic class name if needed
      style={{ width: size, height: size }} // Control the container size
      role="img"
      aria-label={`Aura avatar in ${auraState} state`}
    >
      <ThreeJSAura auraState={auraState} />
    </div>
  );
};

export default AuraAvatar;