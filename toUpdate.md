# Application Improvement Plan (Prioritized)

This document outlines a prioritized list of areas for improvement, focusing on enhancing performance, maintainability, and code quality.

---

### High Priority: Core Architecture
*These tasks address foundational issues that impact stability, state management, and developer experience. They should be completed first.* 

1.  **Implement Global State Management (Frontend)**
    - **Issue:** The root `App.jsx` component manages too much state, leading to complexity and prop drilling.
    - **Recommendation:** Adopt a state management library (e.g., Zustand, Redux Toolkit) to create a global store for `session`, `userProfile`, `subscriptionStatus`, and `onboardingState`. This will simplify component logic and resolve prop drilling.
    - **Status:** ~~Completed~~

2.  **Refactor Monolithic Route Handler (Worker)**
    - **Issue:** The `/api/coaching/message` endpoint is a large `if/else if` block that is difficult to maintain.
    - **Recommendation:** Refactor using a handler map or router to delegate requests to specific modules based on `sessionType`. This will improve code organization and make it easier to add new features.
    - **Status:** ~~Completed~~

3.  **Centralize API and Error Handling (Frontend)**
    - **Issue:** API calls and error handling are inconsistent and spread across multiple components.
    - **Recommendation:** Create a `useApi` hook to standardize loading, error, and data states for all API calls. Implement a global error boundary component to catch and handle unexpected errors gracefully.
    - **Status:** ~~Completed~~

---

### Medium Priority: Robustness & Developer Experience
*These tasks improve the application's robustness, make the codebase easier to work with, and reduce the chance of bugs.*

1.  **Externalize Configuration (Worker)**
    - **Issue:** Chain configurations are hardcoded within route handlers.
    - **Recommendation:** Move configurations to a separate `config.ts` file or a KV namespace for dynamic control without requiring a full deployment.
    - **Status:** ~~Completed~~

2.  **Centralize API Configuration (Frontend)**
    - **Issue:** The `VITE_WORKER_API_URL` is referenced directly in multiple components.
    - **Recommendation:** Centralize API configuration in a dedicated module (e.g., `src/lib/api.js`) that exports pre-configured API functions.
    - **Status:** ~~Completed~~

3.  **Improve Error Handling & Validation (Worker)**
    - **Issue:** Error handling is broad, and error codes are not specific enough.
    - **Recommendation:** Define a more granular set of error codes in `types.ts` to improve client-side error handling and debugging.
    - **Status:** ~~Completed~~

4.  **Create Environment Variable Examples (General)**
    - **Issue:** No example environment file is provided.
    - **Recommendation:** Create a `.env.example` file in both the root and `worker` directories to streamline setup for new developers.
    - **Status:** ~~Completed~~

---

### Low Priority: Code Quality & Housekeeping
*These tasks are important for long-term maintainability but have a lower immediate impact on functionality.*

1.  **Reduce Code Duplication (Frontend)**
    - **Issue:** The loading spinner and "Bolt Badge" are duplicated across several components.
    - **Recommendation:** Create a reusable `LoadingSpinner` component. Add the badge to a higher-order layout component like `AppShell` to avoid repetition.
    - **Status:** ~~Completed~~

2.  **Optimize KV Store Usage (Worker)**
    - **Issue:** A single KV namespace is used for multiple data types.
    - **Recommendation:** Use separate KV namespaces (e.g., `PROFILES`, `SESSIONS`, `SNAPSHOTS`) for better data organization and management.
    - **Status:** ~~Completed~~

3.  **Enhance Linting Rules (General)**
    - **Issue:** The current ESLint configuration is minimal.
    - **Recommendation:** Extend the ESLint configuration with stricter rules for accessibility (`eslint-plugin-jsx-a11y`) and import ordering (`eslint-plugin-import`).
    - **Status:** ~~Completed~~