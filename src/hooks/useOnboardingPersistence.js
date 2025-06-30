import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Custom hook for persistent onboarding data
export const useOnboardingPersistence = () => {
  const { user } = useAuth();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load onboarding progress on mount
  useEffect(() => {
    if (user) {
      loadOnboardingProgress();
    } else {
      // For anonymous users, try localStorage
      loadLocalProgress();
    }
  }, [user]);

  const loadOnboardingProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_onboarding_progress', { p_user_id: user.id });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setOnboardingData(data[0]);
      } else {
        // No server data, check localStorage for migration
        const localData = loadLocalProgress();
        if (localData) {
          // Migrate localStorage data to server
          await saveOnboardingProgress(localData.session_data, localData.current_step);
        }
      }
    } catch (err) {
      console.error('Error loading onboarding progress:', err);
      setError(err.message);
      // Fallback to localStorage
      loadLocalProgress();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalProgress = () => {
    try {
      const stored = localStorage.getItem('onboarding-progress');
      if (stored) {
        const localData = JSON.parse(stored);
        setOnboardingData({
          session_data: localData,
          current_step: localData.currentStep || 'start',
          completed_steps: localData.completedSteps || [],
          progress_percentage: localData.progressPercentage || 0,
          is_completed: localData.isCompleted || false
        });
        return localData;
      }
    } catch (err) {
      console.error('Error loading local progress:', err);
    }
    setLoading(false);
    return null;
  };

  const saveOnboardingProgress = async (sessionData, currentStep, completedSteps = []) => {
    try {
      setError(null);

      // Always save to localStorage for backup
      const backupData = {
        ...sessionData,
        currentStep,
        completedSteps,
        progressPercentage: Math.round((completedSteps.length / 7) * 100),
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('onboarding-progress', JSON.stringify(backupData));

      if (!user) {
        // For anonymous users, only localStorage
        setOnboardingData({
          session_data: sessionData,
          current_step: currentStep,
          completed_steps: completedSteps,
          progress_percentage: backupData.progressPercentage,
          is_completed: completedSteps.length >= 7
        });
        return;
      }

      // For authenticated users, save to server
      const { data, error: saveError } = await supabase
        .rpc('update_onboarding_progress', {
          p_user_id: user.id,
          p_session_data: sessionData,
          p_current_step: currentStep,
          p_completed_steps: completedSteps
        });

      if (saveError) throw saveError;

      // Update local state
      setOnboardingData({
        session_id: data,
        session_data: sessionData,
        current_step: currentStep,
        completed_steps: completedSteps,
        progress_percentage: Math.round((completedSteps.length / 7) * 100),
        is_completed: completedSteps.length >= 7
      });

    } catch (err) {
      console.error('Error saving onboarding progress:', err);
      setError(err.message);
      // Don't throw - let user continue with localStorage backup
    }
  };

  const clearOnboardingProgress = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('onboarding-progress');
      localStorage.removeItem('onboarding-answers');

      if (user) {
        // Mark as abandoned in database
        await supabase
          .from('onboarding_sessions')
          .update({ is_abandoned: true })
          .eq('user_id', user.id);
      }

      setOnboardingData(null);
    } catch (err) {
      console.error('Error clearing onboarding progress:', err);
      setError(err.message);
    }
  };

  const completeOnboarding = async (finalData) => {
    try {
      const completedSteps = ['mindset', 'locus', 'regulatory_focus', 'personality', 'final_focus', 'snapshot', 'first_step'];
      
      await saveOnboardingProgress(finalData, 'completed', completedSteps);

      // Also save to motivational_dna table
      if (user && finalData) {
        const { error: dnaError } = await supabase
          .from('motivational_dna')
          .upsert({
            user_id: user.id,
            locus_of_control: finalData.locus,
            mindset: finalData.mindset,
            regulatory_focus: finalData.regulatory_focus,
            big_five_ocean: {
              disorganized: finalData.personality_disorganized,
              outgoing: finalData.personality_outgoing,
              moody: finalData.personality_moody
            },
            updated_at: new Date().toISOString()
          });

        if (dnaError) {
          console.error('Error saving motivational DNA:', dnaError);
        }
      }

      // Clear backup localStorage after successful completion
      localStorage.removeItem('onboarding-progress');
      localStorage.removeItem('onboarding-answers');

    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError(err.message);
    }
  };

  const getProgress = () => {
    return {
      data: onboardingData?.session_data || {},
      currentStep: onboardingData?.current_step || 'start',
      completedSteps: onboardingData?.completed_steps || [],
      progressPercentage: onboardingData?.progress_percentage || 0,
      isCompleted: onboardingData?.is_completed || false
    };
  };

  const canResume = () => {
    return onboardingData && !onboardingData.is_completed && onboardingData.progress_percentage > 0;
  };

  return {
    loading,
    error,
    onboardingData,
    saveOnboardingProgress,
    loadOnboardingProgress,
    clearOnboardingProgress,
    completeOnboarding,
    getProgress,
    canResume
  };
};