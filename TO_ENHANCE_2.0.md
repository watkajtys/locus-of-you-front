# ENHANCEMENT-PLAN-2.0.md

This document outlines a series of enhancements to the LocusOfYou onboarding flow. The changes are optimized for personalization and reduced user friction, designed to be implemented by a CLI agent.

---

## STEP 1: Implement DNA-Powered UI Personalization

**Objective:** Adapt the app's UI theme and behavior based on the user's calculated "Motivational DNA" archetype to enhance the feeling of personalization.

**File to Modify:** `src/App.jsx`

**Instructions:**
1.  After the `handleSnapshotContinue` function successfully generates the snapshot and archetype, add a function call to apply a theme based on the archetype.

    ```javascript
    // In src/App.jsx, inside the AppContent component

    const handleSnapshotContinue = () => {
      // Existing logic to set view to 'firstStep'
      console.log('Continuing from snapshot to first step');
      const userArchetype = useStore.getState().onboardingAnswers?.archetype; // Assuming archetype is stored
      if (userArchetype) {
        applyThemeForArchetype(userArchetype);
      }
      setCurrentView('firstStep');
    };
    ```

2.  Add a new theming function to `src/hooks/useTheme.js`.

    ```javascript
    // In src/hooks/useTheme.js

    export const applyThemeForArchetype = (archetype) => {
      const root = document.documentElement;
      let themeOverrides = {};

      switch (archetype) {
        case 'Visionary Achiever':
        case 'Opportunistic Realist':
          themeOverrides = {
            '--color-accent': '#f59e0b', // A more vibrant, energetic color
          };
          break;
        case 'Steady Builder':
        case 'Reliable Executor':
           themeOverrides = {
            '--color-primary': '#dbeafe', // A more structured, stable color
          };
          break;
        // Add more cases for other archetypes
      }

      for (const [property, value] of Object.entries(themeOverrides)) {
        root.style.setProperty(property, value);
      }
    };
    ```

---

## STEP 2: Enhance the "First Step" Rationale

**Objective:** Make the AI's rationale for the first task more explicitly adaptive by directly referencing the user's onboarding answers.

**File to Modify:** `worker/src/chains/interventions.ts`

**Instructions:**
1.  Locate the `generateFirstMicrotask` function.
2.  Update the system prompt to instruct the AI to be more explicit in its reasoning.

    ```typescript
    // In worker/src/chains/interventions.ts, within the InterventionsChain class

    async generateFirstMicrotask(onboardingAnswers: OnboardingAnswers, userProfile: UserProfile): Promise<Microtask> {
      const systemPrompt = new SystemMessage(
        `You are an AI coach. Your goal is to generate a single, impossibly small first step.
        You will receive the user's onboarding answers.
        Your rationale MUST explicitly reference their answers to build trust.

        **Example Rationale:** "Because you mentioned your goal is to '{goal_context}' and that you're motivated by '{motivation_source}', we're starting with a task that creates a visible, tangible result."

        You MUST return a single, valid JSON object with "rationale" and "task" keys.`
      );

      const humanMessage = new HumanMessage(
        `Onboarding Answers: ${JSON.stringify(onboardingAnswers, null, 2)}
         User's Psychological Profile: ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}`
      );

      // ... rest of the function
    }
    ```

---

## STEP 3: Implement Choice-Based Goal Funnel

**Objective:** Replace the free-response goal-setting question with a two-step, choice-based funnel to reduce friction.

**File to Modify:** `src/components/DynamicOnboarding.jsx`

**Instructions:**
1.  Remove the final text input question object from the `questions` array.
2.  Add two new choice-based question objects in its place.

    ```javascript
    // In src/components/DynamicOnboarding.jsx, update the 'questions' array

    const questions = [
      // ... (previous questions 1-7) ...
      {
        id: 'goal_category',
        type: 'choice',
        message: "Okay, last part. To make sure we're effective, let's pinpoint your focus. Which area of your life feels most important right now?",
        question: "Which area of your life feels most important right now?",
        options: [
          { id: 'A', label: "Career & Work", value: 'career' },
          { id: 'B', label: "Health & Wellness", value: 'health' },
          { id: 'C', label: "Home & Organization", value: 'home' },
          { id: 'D', label: "Personal Growth", value: 'growth' }
        ]
      },
      {
        id: 'goal_subcategory',
        type: 'choice',
        message: "Got it. When you think about that, what's the first thing that comes to mind?",
        question: "What's the first thing that comes to mind?",
        options: (answers) => { // Options are now a function of previous answers
          switch (answers.goal_category) {
            case 'home':
              return [
                { id: 'A', label: "A cluttered space", value: 'clutter' },
                { id: 'B', label: "Unfinished projects", value: 'projects' },
                { id: 'C', label: "Wasted time", value: 'time' },
              ];
            // Add cases for other categories
            default:
              return [];
          }
        }
      }
    ];
    ```

3.  Update the `handleAnswerSelect` logic to handle the dynamic options and know when onboarding is complete.

---

## STEP 4: Implement "Two-Tap Reflection"

**Objective:** Replace the single-choice reflection with a contextual two-step process to gather more nuanced data without free-text input.

**File to Modify:** `src/components/ReflectionScreen.jsx`

**Instructions:**
1.  Introduce a new state to manage the reflection flow (e.g., `reflectionStep`).
2.  After the user makes their first selection, update the UI to show a second set of contextual choices instead of immediately calling the backend.
3.  Combine the results of both taps into a single payload to send to the backend.

    ```javascript
    // In src/components/ReflectionScreen.jsx

    const [reflectionStep, setReflectionStep] = useState(1);
    const [firstChoice, setFirstChoice] = useState(null);

    const handleFirstChoice = (option) => {
      setFirstChoice(option);
      setReflectionStep(2);
    };

    const handleSecondChoice = (secondOption) => {
      const combinedReflectionId = `${firstChoice.id}_${secondOption.id}`;
      // Now, call sendReflectionToBackend with the combined data
      sendReflectionToBackend({ id: combinedReflectionId, text: `${firstChoice.text} - ${secondOption.text}` });
    };

    // In the render method, conditionally render the next set of buttons
    // based on the value of 'reflectionStep' and 'firstChoice'.
    ```

---

## STEP 5: Accelerate the Post-Reflection Flow

**Objective:** Streamline the user journey by combining the "Coach Feedback" and "Momentum Mirror" screens.

**Files to Modify:** `src/components/ReflectionScreen.jsx` and `src/App.jsx`

**Instructions:**
1.  Modify the `ReflectionScreen.jsx` `onComplete` handler. Instead of just hiding the buttons, it should now directly trigger the navigation to the Momentum Mirror.

    ```javascript
    // In src/components/ReflectionScreen.jsx, inside sendReflectionToBackend success block

    const responseData = await response.json();
    setMomentumMirrorData(responseData.data.momentumMirror);
    // ... other data setting ...
    onComplete(); // This will now be handled by App.jsx to change the view
    ```

2.  Update the `handleReflectionComplete` function in `src/App.jsx` to navigate directly to the `momentumMirror` view, bypassing the intermediate feedback screen.

    ```javascript
    // In src/App.jsx

    const handleReflectionComplete = () => {
      console.log('Reflection completed, proceeding to momentum mirror.');
      setCurrentView('momentumMirror');
    };
    ```

3.  Ensure the `AIMessageCard` in `MomentumMirror.jsx` can display the initial validating text from the old feedback screen. The prompt in `generateMomentumMirrorFeedback` in the worker should be updated to include this.