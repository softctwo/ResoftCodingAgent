---
name: minimax
description: "Workflow templates for frontend, fullstack, mobile, and documentation projects. Use when starting new projects or following structured development workflows."
---

# MiniMaxSkills: Structured Workflow Templates

Proven workflow templates for different project types. Follow these step-by-step pipelines to reduce rework and deliver faster.

## Frontend Workflow

```
Design → Component → Style → Test
```

### 1. Design
- Define the component tree hierarchy
- Specify props/state for each component
- Map user interactions to event handlers
- Decide on data fetching strategy (client vs. server)

### 2. Component
- Create component files with proper structure
- Implement props interfaces (TypeScript)
- Add event handlers and state management
- Wire up data fetching (loading, error, success states)

### 3. Style
- Apply CSS modules, Tailwind, or styled-components
- Ensure responsive design (mobile-first)
- Add loading skeletons and empty states
- Handle dark mode if required

### 4. Test
- Unit tests for component logic
- Snapshot tests for UI stability
- Interaction tests for user flows
- Accessibility audit (axe-core, keyboard nav)

---

## Fullstack Workflow

```
Schema → API → Frontend → Integration
```

### 1. Schema
- Design database models and relationships
- Define validation rules and constraints
- Write migration scripts
- Seed data for development

### 2. API
- Define REST or GraphQL endpoints
- Implement controllers/resolvers
- Add authentication and authorization
- Write API tests (request/response validation)

### 3. Frontend
- Build UI components consuming the API
- Handle loading, error, and empty states
- Implement form validation
- Add optimistic updates where appropriate

### 4. Integration
- End-to-end tests for critical flows
- Verify data consistency across layers
- Test error scenarios (network failure, timeouts)
- Performance profiling and optimization

---

## Mobile Workflow

```
Screen → State → Navigation → Test
```

### 1. Screen
- Design screen layout and component hierarchy
- Define navigation parameters
- Plan gesture and animation interactions

### 2. State
- Choose state management (Context, Redux, Zustand)
- Define actions, reducers, and selectors
- Handle persistence and offline state
- Manage loading and error states

### 3. Navigation
- Implement stack, tab, and drawer navigation
- Handle deep linking
- Pass parameters between screens
- Guard protected routes

### 4. Test
- Component tests with React Native Testing Library
- Integration tests for navigation flows
- E2E with Detox or Maestro
- Device-specific testing

---

## Documentation Workflow

```
Structure → Draft → Review → Publish
```

### 1. Structure
- Define audience and goals
- Create outline with clear hierarchy
- Identify code examples and diagrams needed
- Choose format (README, wiki, docs site)

### 2. Draft
- Write clear, concise content
- Include runnable code examples
- Add diagrams for complex concepts
- Link to related documentation

### 3. Review
- Technical accuracy check
- Clarity and readability review
- Verify all code examples work
- Grammar and style check

### 4. Publish
- Format for target platform
- Add metadata (tags, description)
- Set up redirects if replacing old docs
- Announce to team
