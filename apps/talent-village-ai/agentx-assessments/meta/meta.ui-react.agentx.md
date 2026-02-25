---
# AgentX meta spec: React & UI. Use this document as the source of truth to generate
# interview question agentx files. Multiple versions of this meta may exist (e.g. v1, v2).
kind: meta
title: React & UI Development
slug: ui-react
version: "1.0.0"
description: Standards and required skills for React/UI roles. Use to generate basic, advanced, and domain-specific interview question agentx files.

generate:
  basic: ui-react-basic.agentx.md
  advanced: ui-react-advanced.agentx.md
  domains:
    - slug: healthcare
      file: ui-react.healthcare.domain.agentx.md
    - slug: financial
      file: ui-react.financial.domain.agentx.md

instructions: |
  From this meta spec, generate agentx markdown files for interview questions.
  - basic: foundational concepts, definitions, simple scenarios (junior/mid).
  - advanced: deep dives, architecture, performance, edge cases (senior+).
  - domain: apply the same skills to the named domain (e.g. healthcare compliance, financial data UX).
  Each generated file MUST have YAML front matter with kind (basic|advanced|domain), slug, version, and parent_meta pointing to this slug.
---

# React & UI Development Standards - TalentVillage.ai

## Core Technology Stack

- **Framework**: React 18+
- **Styling**: Tailwind CSS for utility-first styling.
- **Components**: Radix UI for accessible primitives.
- **Icons**: Lucide React.

## Component Architecture

- Use functional components with hooks.
- Favor composition over inheritance.
- Keep components small and focused on a single responsibility.
- Implement proper loading states and error boundaries.

## Required Skills

### React Core Expertise
- **Hooks**: useState, useEffect, useContext, useReducer, useMemo, useCallback, useRef
- **Custom Hooks**: Creating reusable logic, dependency management, and hook composition
- **Component Lifecycle**: Understanding render cycles, cleanup, and optimization
- **Context API**: Global state management, provider patterns, and performance considerations
- **Reconciliation**: Virtual DOM, keys, and React's diffing algorithm
- **React 18+**: Concurrent features, Suspense, transitions, and automatic batching

### Modern JavaScript/TypeScript
- **ES6+ Features**: Destructuring, spread/rest, arrow functions, async/await, optional chaining
- **TypeScript**: Interfaces, types, generics, utility types, and React type definitions
- **Functional Programming**: Pure functions, immutability, higher-order functions, composition
- **Module Systems**: ESM imports, dynamic imports, code splitting
- **Promises & Async**: Handling asynchronous operations, error boundaries for async

### Styling & Design
- **Tailwind CSS**: Utility-first approach, responsive design, custom configurations, JIT mode
- **CSS-in-JS**: Styled-components, Emotion (understanding alternatives)
- **Responsive Design**: Mobile-first approach, breakpoints, fluid layouts
- **Design Tokens**: Color schemes, spacing scale, typography system
- **Dark Mode**: Theme switching, system preference detection, persistent preferences
- **Animations**: CSS transitions, keyframes, Framer Motion for complex animations

### Component Libraries
- **Radix UI**: Unstyled accessible primitives, composition patterns, and customization
- **Headless UI**: Alternative accessible component library
- **Lucide React**: Icon system, customization, and optimization
- **Component Patterns**: Compound components, render props, controlled/uncontrolled components

### State Management
- **React State**: Local state management, lifting state up, prop drilling solutions
- **Context**: Global state without external libraries, performance optimization
- **Zustand**: Lightweight state management, selectors, and middleware
- **TanStack Query**: Server state management, caching, refetching, and optimistic updates
- **Jotai/Recoil**: Atomic state management (optional but valuable)

### Forms & Validation
- **React Hook Form**: Performant forms, validation, error handling
- **Zod**: Schema validation, type inference, error messages
- **Form UX**: Field validation, error display, loading states, success feedback
- **Accessibility**: Proper labeling, error announcements, keyboard navigation

### Routing & Navigation
- **React Router**: v6+ navigation, nested routes, loaders, and actions
- **TanStack Router**: Type-safe routing alternative
- **Navigation Patterns**: Protected routes, redirects, navigation guards
- **URL State**: Search params, hash routing, and deep linking

### Performance Optimization
- **Code Splitting**: Lazy loading, dynamic imports, route-based splitting
- **Memoization**: React.memo, useMemo, useCallback for preventing re-renders
- **Bundle Optimization**: Tree shaking, dead code elimination, analyzing bundle size
- **Image Optimization**: Lazy loading images, responsive images, WebP format
- **Profiling**: React DevTools Profiler, identifying performance bottlenecks
- **Core Web Vitals**: LCP, FID, CLS optimization

### Accessibility (a11y)
- **WCAG Guidelines**: AA compliance minimum, understanding AAA standards
- **Semantic HTML**: Proper element usage, headings hierarchy, landmarks
- **ARIA**: Roles, states, properties, and when to use them
- **Keyboard Navigation**: Focus management, tab order, keyboard shortcuts
- **Screen Readers**: Testing with NVDA, JAWS, VoiceOver
- **Color Contrast**: Meeting contrast ratios, colorblind-friendly palettes

### Testing
- **Unit Testing**: Vitest or Jest, testing library best practices
- **Component Testing**: React Testing Library, user-centric testing approach
- **E2E Testing**: Playwright or Cypress for full user workflows
- **Visual Regression**: Chromatic, Percy for visual testing
- **Accessibility Testing**: axe-core, testing for a11y issues

### Build Tools & Development
- **Vite**: Fast development server, HMR, build optimization
- **TypeScript Configuration**: Path aliases, strict mode, project references
- **ESLint**: React-specific rules, hooks rules, a11y linting
- **Prettier**: Code formatting, integration with editors
- **Package Management**: npm, yarn, pnpm understanding

### API Integration
- **Fetch API**: Making HTTP requests, error handling, AbortController
- **TanStack Query**: Data fetching, caching, background updates, mutations
- **GraphQL**: Apollo Client or URQL (optional but valuable)
- **WebSockets**: Real-time updates, Socket.io integration
- **Error Handling**: Retry logic, error boundaries, user feedback

### Browser APIs
- **Storage**: localStorage, sessionStorage, IndexedDB
- **Intersection Observer**: Lazy loading, infinite scroll
- **Web Workers**: Offloading heavy computations
- **Service Workers**: PWA capabilities, offline support, caching strategies
- **Browser APIs**: Clipboard, notifications, geolocation

### Design Patterns
- **Component Composition**: Higher-order components, render props, hooks patterns
- **State Machines**: XState for complex state logic (optional)
- **Error Boundaries**: Graceful error handling and fallback UIs
- **Suspense**: Loading states, data fetching patterns
- **Portals**: Modals, tooltips, dropdowns rendering

### Developer Experience
- **Dev Tools**: React DevTools, browser DevTools, performance profiling
- **Documentation**: Component documentation, Storybook for component library
- **Code Review**: Best practices, performance considerations, accessibility checks
- **Git Workflows**: Feature branches, pull requests, semantic commits

### Soft Skills
- **Design Collaboration**: Working with designers, implementing mockups accurately
- **Problem Solving**: Debugging React-specific issues, state management problems
- **Communication**: Explaining technical decisions, documenting component APIs
- **User Empathy**: Understanding user needs, accessibility mindset
- **Continuous Learning**: Keeping up with React ecosystem changes and best practices

## Tags

#react #ui #frontend #javascript
