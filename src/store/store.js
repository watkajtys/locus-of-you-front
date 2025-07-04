import { create } from 'zustand';

const useStore = create((set) => ({
  // State variables
  session: null,
  userProfile: null,
  hasSubscription: false,
  onboardingAnswers: null,
  isLoading: true,
  currentIsfsTask: '',
  currentView: 'onboarding', // Initial view

  // Actions
  setSession: (session) => set({ session }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setHasSubscription: (status) => set({ hasSubscription: status }),
  setOnboardingAnswers: (answers) => set({ onboardingAnswers: answers }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setCurrentIsfsTask: (task) => set({ currentIsfsTask: task }),
  setCurrentView: (view) => set({ currentView: view }),

  // Action to clear user-specific state on logout
  clearUserState: () =>
    set({
      session: null,
      userProfile: null,
      hasSubscription: false,
      onboardingAnswers: null,
      currentIsfsTask: '',
      currentView: 'onboarding', // Reset to initial view or an auth view
    }),
}));

export default useStore;
