---
name: vercel-skills
description: "Web development quality rules for React, Next.js, and frontend projects. Use when building web pages, components, or reviewing frontend code."
---

# Vercel Agent Skills: Frontend Quality Rules

Comprehensive quality standards for modern web development. Apply these rules when building React, Next.js, or any frontend project.

## Performance

### Bundle Size
- Keep initial JavaScript bundles under 200KB (gzipped)
- Use `next/dynamic` or `React.lazy` for code splitting
- Tree-shake unused imports; prefer named imports
- Analyze with `@next/bundle-analyzer` or `vite-bundle-visualizer`

### Lazy Loading
- Lazy load below-the-fold content
- Use `loading.tsx` (Next.js) or Suspense boundaries
- Defer non-critical third-party scripts
- Lazy load images with `loading="lazy"`

### Image Optimization
- Use `next/image` or a responsive image component
- Serve WebP/AVIF formats with fallbacks
- Specify width/height to prevent layout shift
- Compress images before adding to the project

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s — optimize hero images, server-render critical content
- **FID/INP (Interaction to Next Paint):** < 200ms — split long tasks, avoid large event handlers
- **CLS (Cumulative Layout Shift):** < 0.1 — reserve space for dynamic content, use `size` on images

---

## Accessibility

### ARIA & Semantics
- Use semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`
- Add `aria-label` to icon-only buttons and links
- Use `role` only when the semantic element can't be used
- Ensure form inputs have associated `<label>` elements

### Keyboard Navigation
- All interactive elements must be focusable and operable via keyboard
- Visible focus indicators (don't use `outline: none` without replacement)
- Logical tab order matching visual layout
- Skip-to-content link as the first focusable element

### Color & Contrast
- Text contrast ratio ≥ 4.5:1 (AA) or 7:1 (AAA)
- Don't rely solely on color to convey information
- Test with color blindness simulators

---

## Component Architecture

### Composition
- Prefer composition over inheritance
- Single responsibility: one component, one job
- Extract reusable logic into custom hooks
- Keep components under 200 lines; split if larger

### State Management
- Server state: React Query / SWR
- Client state: useState, useReducer, or Zustand
- URL state: search params and route params
- Avoid prop drilling beyond 2 levels; use context or composition

### Routing
- Use file-system routing (Next.js App Router) or declarative routing
- Handle 404 and error states per route
- Use middleware for auth guards and redirects

---

## Engineering Standards

### TypeScript
- Enable `strict: true` in tsconfig
- Avoid `any`; use `unknown` and type guards instead
- Prefer interfaces for public APIs, type aliases for unions
- Derive types from data with `typeof` and `ReturnType`

### Error Boundaries
- Wrap feature sections in error boundaries
- Log errors to a monitoring service (Sentry, Datadog)
- Show user-friendly fallback UI, not raw stack traces

### Testing
- Unit tests for utilities and hooks
- Component tests for UI behavior (React Testing Library)
- E2E for critical flows (Playwright, Cypress)
- Aim for 80%+ coverage on business logic

---

## Next.js Specifics

### Rendering Strategies
- **SSR (Server-Side Rendering):** Dynamic, per-request data (use `cache` headers)
- **ISR (Incremental Static Regeneration):** Semi-dynamic content, revalidate periodically
- **Static:** Content that never changes; pre-render at build time
- **Edge:** Low-latency, globally distributed rendering

### App Router Patterns
- `layout.tsx` for shared UI across routes
- `loading.tsx` for suspense-based loading states
- `error.tsx` for route-level error handling
- `not-found.tsx` for custom 404 pages

### Middleware
- Use for auth checks, redirects, header modifications
- Keep middleware fast — it runs on every matching request
- Avoid database calls in middleware; use token verification instead
