# Application Improvement Plan

This document outlines areas for improvement in the application, identified during a code review. The focus is on enhancing performance, maintainability, and code quality.

### Frontend (`src/`)

1.  **State Management:**
    - **Issue:** The root `App.jsx` component manages too much state, leading to complexity and prop drilling.
    - **Recommendation:** Adopt a state management library (e.g., Zustand, Redux Toolkit) to create a global store for `session`, `userProfile`, `subscriptionStatus`, and `onboardingState`.

2.  **Component Architecture & Prop Drilling:**
    - **Issue:** Props like `session` and `hasSubscription` are passed down through many component layers.
    - **Recommendation:** Use React Context or the global state management solution to provide this data directly to the components that need it.

3.  **Hardcoded Configuration:**
    - **Issue:** The `VITE_WORKER_API_URL` is referenced directly in multiple components.
    - **Recommendation:** Centralize API configuration in a dedicated module (e.g., `src/lib/api.js`) that exports pre-configured API functions.

4.  **Error Handling:**
    - **Issue:** Inconsistent error handling, with most errors only logged to the console.
    - **Recommendation:** Implement a global error boundary component. Create a `useApi` hook to standardize loading, error, and data states for all API calls.

5.  **Code Duplication:**
    - **Issue:** The loading spinner and "Bolt Badge" are duplicated across several components.
    - **Recommendation:** Create a reusable `LoadingSpinner` component. Add the badge to a higher-order layout component like `AppShell` to avoid repetition.

### Worker (`worker/`)

1.  **Configuration Management:**
    - **Issue:** Chain configurations are hardcoded within route handlers.
    - **Recommendation:** Move configurations to a separate `config.ts` file or a KV namespace for dynamic control.

2.  **Monolithic Route Handler:**
    - **Issue:** The `/api/coaching/message` endpoint is a large `if/else if` block that is difficult to maintain.
    - **Recommendation:** Refactor using a handler map or router to delegate requests to specific modules based on `sessionType`.

3.  **KV Store Usage:**
    - **Issue:** A single KV namespace is used for multiple data types.
    - **Recommendation:** Use separate KV namespaces (e.g., `PROFILES`, `SESSIONS`, `SNAPSHOTS`) for better data organization and management.

4.  **Error Handling & Validation:**
    - **Issue:** Error handling is broad, and error codes are not specific enough.
    - **Recommendation:** Define a more granular set of error codes in `types.ts` to improve client-side error handling.

### General

1.  **Environment Variables:**
    - **Issue:** No example environment file is provided.
    - **Recommendation:** Create a `.env.example` file in both the root and `worker` directories.

2.  **Linting:**
    - **Issue:** The current ESLint configuration is minimal.
    - **Recommendation:** Extend the ESLint configuration with stricter rules for accessibility (`eslint-plugin-jsx-a11y`) and import ordering (`eslint-plugin-import`).
