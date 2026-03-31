# Auth Flows (Current + Proposed)

**Status: ✅ IMPLEMENTED (2026-03-31)**

All auth flow fixes have been implemented and are ready for testing.

## What Was Fixed

### 1. Protected Route Guard ✅
**File:** `apps/web/src/app/(app)/layout.tsx`
- Added client-side auth check
- Unauthenticated users → redirect to `/login?returnUrl={pathname}`
- Prevents flash of protected content

### 2. Login/Signup Redirects ✅
**File:** `apps/web/src/components/auth-form.tsx`
- Login: reads `returnUrl` from query params, defaults to `/dashboard`
- Signup: redirects to `/dashboard` (not `/properties`)

### 3. Logout Redirect ✅
**File:** `apps/web/src/components/auth-provider.tsx`
- Clears auth state
- Redirects to `/login`

### 4. Session Expiry Handling ✅
**File:** `apps/web/src/lib/api.ts`
- Detects 401 responses
- Clears auth state
- Redirects to `/login?returnUrl={current}&reason=expired`

### 5. Landing Page Auto-Redirect ✅
**File:** `apps/web/src/app/page.tsx`
- Logged-in users → auto-redirect to `/dashboard`
- Logged-out users → show hero/CTA

### 6. Navigation Verified ✅
- "Go to Properties" button → `/properties` (correct)
- All other navigation working as expected

---

## Current State (as implemented)

### Landing / Home (`/`)
- Logged out: Renders marketing hero + CTA buttons.
  - "Go to Properties" button links to `/properties`.
  - "Sign in" button links to `/login`.
- Logged in: No automatic redirect. Page renders the same hero/CTA.

### Login (`/login`)
- Form submit calls `/auth/login`.
- Success: stores token + user in `localStorage` and **always** redirects to `/properties`.
- Failure: shows error message returned by API (e.g., "Invalid credentials").
- Remember me: not implemented.

### Signup (`/signup`)
- Form submit calls `/auth/signup`.
- Success: stores token + user in `localStorage` and **always** redirects to `/properties`.
- Failure: shows error message returned by API (e.g., "Email already in use").

### Logout
- Location: App shell user menu ("Sign out").
- Behavior: Clears token/user from `localStorage` and clears auth context state.
- Redirect: **none** (user stays on current page).
- Messaging: **none** (no toast or banner).

### Protected App Routes (`/(app)`)
- Routes include `/dashboard`, `/properties`, `/tenants`, `/expenses`, `/analytics`, `/documents`, etc.
- There is **no route guard** in the Next.js app; pages render regardless of auth state.
- Each page uses `apiFetch(..., { auth: true })` for data.
- If logged out, API calls return 401 and the UI shows a generic error message (no redirect to login).

### Deep Links
- Direct access to `/properties/:id`, `/tenants/:id`, etc. will load the page.
- If logged out, API fetch errors show inline (no redirect). There is no `returnUrl` handling.

### Session Management
- Token is a JWT (expires in 7 days). No refresh token flow.
- When token expires, API returns 401; UI shows generic error and user remains "logged in" in local storage.
- Multi-tab sync: not implemented. Tabs can diverge on logout or token expiry.

## Issues Found (bugs + UX gaps)

### Critical
- No protected-route enforcement in the Next.js app; unauthenticated users can navigate into app routes and just see fetch errors.
- Logout does not redirect (stays on current page).
- Login/Signup redirect always goes to `/properties` (no `returnUrl` support, no `/dashboard` default).

### Important
- Landing page does not auto-redirect logged-in users to `/dashboard`.
- Token expiry is not handled (no session-expired redirect, no cleanup).
- Deep link flows lack `returnUrl` preservation.

### Nice-to-have
- No "Remember me" option or persistence controls.
- No multi-tab sync for logout/session expiry.

## Expected Behavior (target state)

### Landing (`/`)
- Logged out: Show hero + CTA buttons (Sign Up, Login).
- Logged in: Auto-redirect to `/dashboard`.
- CTA: "Go to Properties" should go to `/properties`.

### Login (`/login`)
- Success: Redirect to `returnUrl` if present, else `/dashboard`.
- Failure: Show error, stay on `/login`.
- Support `?returnUrl=/properties/123`.

### Signup (`/signup`)
- Success: Redirect to `/dashboard` (first-time onboarding).
- Failure: Show error, stay on `/signup`.

### Logout
- Clear session/token.
- Redirect to `/login` (or `/`).
- Show success message: "Logged out successfully".

### Protected Routes
- Unauthenticated access -> redirect to `/login?returnUrl={current}`.
- After login -> redirect back to intended page.

### Session Expiry
- Expired token -> redirect to `/login` with message "Session expired, please login again" and preserve `returnUrl`.

## Proposed Fixes (high-level)

1) Add a protected-route guard (client or Next.js middleware) for `/(app)` routes.
2) Support `returnUrl` handling in login and signup flows.
3) Redirect on logout and provide a success message.
4) Add session-expired detection in `apiFetch` (401 => clear auth + redirect to login with message).
5) Add logged-in redirect from `/` to `/dashboard`.
6) Optional: add multi-tab sync via `storage` event.

## User Journey Diagrams (text-based)

### Login (happy path)
Logged out -> Visit `/login` -> Submit form -> API success -> Store token -> Redirect to `returnUrl` or `/dashboard`.

### Protected route (logged out)
Logged out -> Visit `/properties/123` -> Guard redirects to `/login?returnUrl=/properties/123` -> Login -> Redirect back to `/properties/123`.

### Logout
User clicks "Sign out" -> Clear auth -> Redirect to `/login` -> Show "Logged out successfully".

### Session expiry
User token expires -> API returns 401 -> Clear auth -> Redirect to `/login?returnUrl={current}&reason=expired` -> Show "Session expired".
