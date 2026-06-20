# User Journey Audit

This document maps the current user-facing journeys in the app so a later logic audit can verify whether auth, child state, diagnostic state, and subscription state behave consistently across the product.

The app is treated as a parent-facing product with public acquisition flows and an authenticated parent shell. Admin and cron internals are out of scope here unless they directly affect a user-visible journey.

## Route Groups

### Public routes

- `/`
  - Public landing page with primary CTAs to `/signup` and `/diagnostic`
  - Includes the homepage `OnboardingPlanner` signup funnel
  - Includes a secondary discovery path to `/guides`
- `/guides`
  - Public SEO index page
- `/guides/[slug]`
  - Public SEO guide detail pages
- `/diagnostic`
  - Public baseline assessment
  - Works for signed-out users and signed-in users
- `/login`
  - Existing-user sign-in
  - Resend confirmation entry
  - Forgot-password entry
- `/signup`
  - Standard account creation
  - Guest-diagnostic claim variant through query params
  - Pending-confirmation state
- `/forgot-password`
  - Password reset request page
- `/reset-password`
  - Password recovery completion page
- `/auth/confirm`
  - Signup confirmation handler
- `/auth/callback`
  - Code-exchange callback route
- `/privacy`
- `/terms`

### Authenticated app-shell routes

All routes under `src/app/(app)` are auth-gated by the shared layout and redirect signed-out users to `/login`.

- `/dashboard`
- `/dashboard/add-student`
- `/diagnostics`
- `/practice`
- `/practice/[type]/[category]`
- `/library`
- `/library/handbook`
- `/library/topic/[name]`
- `/analytics`
- `/leaderboard`
- `/referrals`
- `/pricing`
- `/settings`
- `/study-plan`
- `/parent/dashboard`

### Reachable dynamic variants and redirect surfaces

These are still user-visible paths that should be treated as first-class audit targets:

- `/practice/topic/[topic]`
- `/practice/drill/[subject]`
- `/practice/mock/[subject]`
- `/practice/topic/[topic]?mode=balanced`
- `/practice/topic/[topic]?mode=mcq`
- `/practice/topic/[topic]?mode=written`
- `/practice/topic/[topic]?length=10|25|50`
- `/practice/mock/[subject]?length=20|40`
- `/library/[slug]`
  - redirect shim into `/library/topic/[name]`

### User-visible support routes and APIs

These are not navigated like pages, but they materially affect user journeys and must be included in the later logic audit:

- `/api/checkout`
- `/api/portal`
- `/api/explain`
- `/api/grade`
- `/api/unsubscribe`
- `/api/webhooks/stripe`
- `/api/admin/subscription-reconcile`

## Current Journey Map

### 1. Signed-out visitor acquisition

#### Landing-driven flow

1. User lands on `/`
2. User chooses one of:
   - `/signup`
   - `/diagnostic`
   - `/guides`
   - `/login`
3. User remains fully public until entering an authenticated route under `(app)`

#### SEO-driven flow

1. User lands on `/guides` or `/guides/[slug]`
2. User is pushed toward:
   - `/diagnostic` as the main educational CTA
   - `/signup` as a secondary conversion route on selected guide pages
3. User stays signed out unless they intentionally convert

### 2. Diagnostic-first lead funnel

This is the main pre-auth product funnel for users who want value before account creation.

1. Signed-out user visits `/diagnostic`
2. Diagnostic questions are loaded server-side from the question bank
3. User completes the baseline in `DiagnosticSession`
4. Result is stored as guest/lead state:
   - client-side pending result is kept in local storage
   - server-side lead capture is also used
5. User is prompted to create an account
6. User goes through `/signup`
7. Email confirmation completes through `/auth/confirm`
8. User lands on `/dashboard`
9. First authenticated dashboard load tries to claim the lead diagnostic onto the child profile
10. `/diagnostics` can also surface pending saved diagnostic state when the user is authenticated but still has no child

### 3. Direct signup flow

1. User visits `/signup`
2. `signup(...)` creates the auth user and a `profiles` row with `subscription_status: free`
3. User is redirected back to `/signup?confirm=1...`
4. User confirms email through `/auth/confirm`
5. Successful confirmation redirects to `/dashboard`

Notes on current behaviour:

- Standard `/signup` does not create a child
- Homepage `OnboardingPlanner` uses `signUpAndCreateChild(...)`, which does create a child during signup
- Both signup flows still land in email-confirmation before access is fully usable

### 4. Login, resend, and recovery flow

#### Standard login

1. User visits `/login`
2. `login(...)` calls `supabase.auth.signInWithPassword`
3. Success redirects to `/dashboard`

#### Resend confirmation

1. User opens resend flow from `/login` or `/signup`
2. `resendEmail(...)` sends a signup confirmation email
3. User stays in the same UX family:
   - `/login?...`
   - `/signup?confirm=1...`

#### Password reset

1. User visits `/forgot-password`
2. `requestPasswordReset(...)` triggers Supabase reset email
3. User clicks email link and lands on `/reset-password`
4. Recovery session is established via hash tokens or `token_hash`
5. User sets a new password
6. Flow signs the user out and redirects to `/login?message=...`

### 5. Authenticated free parent flow

#### App entry

1. User enters any `(app)` route
2. `(app)/layout.tsx` checks auth and loads sidebar profile state
3. Sidebar renders account and child summary data when present

#### No-child state

Current behaviour with no child:

- `/dashboard`
  - renders, but child-specific sections are mostly empty or softened
  - has add-student affordances
- `/dashboard/add-student`
  - explicit child creation route
- `/analytics`
  - redirects to `/dashboard`
- `/parent/dashboard`
  - redirects to `/dashboard/add-student`
- `/diagnostics`
  - shows `DiagnosticsNoChildState`
  - can surface a pending pre-child diagnostic and prompt the user to add a child

#### Child exists, no diagnostic yet

- `/dashboard`
  - nudges toward a baseline
- `/diagnostics`
  - shows first-diagnostic CTA
- `/diagnostic`
  - can be taken while signed in and tied directly to the child

#### Practice and content access for free users

- `/practice`
  - currently starts an immediate generic practice session with 10 fetched questions
  - it is not a chooser or true hub page
- `/practice/topic/[topic]`
  - topic practice is available
  - prep screen appears unless the session is a mission shortcut
- `/practice/topic/[topic]?mode=balanced`
  - mixed question types where available
- `/practice/topic/[topic]?mode=mcq`
  - multiple-choice-only topic practice
- `/practice/topic/[topic]?mode=written`
  - gated to `/pricing`
- `/practice/topic/[topic]?length=50`
  - visually offered, but should be checked later for whether free users are truly prevented from using the Pro-marked long session
- `/practice/drill/[subject]`
  - subject-level drill route should be treated separately from topic practice
- `/practice/mock/[subject]`
  - gated to `/pricing`
- `/library`
  - available to authenticated users
- `/library/handbook`
  - available to authenticated users
  - contains CTA into `/practice/mock/Mixed`
- `/library/topic/[name]`
  - available to authenticated users
  - contains CTA into `/practice/topic/[topic]`
- `/library/[slug]`
  - redirect layer into `/library/topic/[name]`
- `/study-plan`
  - available to authenticated users with a child
  - contains links into topic practice, mock, drill, and library
- `/leaderboard`
  - visible to authenticated users
  - footer CTA currently routes to `/dashboard`, not directly to a practice route

#### Subscription surfaces for free users

- `/pricing`
  - authenticated upsell page
- `/settings`
  - shows free-plan state and upgrade CTA
- `/referrals`
  - available while free
  - may surface pending referral credit prompt to upgrade

### 6. Trialing and paid parent flow

Paid access is determined by `hasProAccess(profile)`, which is true only for:

- `trialing`
- `active`

Paid/trial users share the same app shell as free users but gain access to:

- `/practice/mock/[subject]`
- written practice mode
- `/api/explain`
- `/api/grade`
- Stripe billing management where `stripe_customer_id` exists
- the long-tail in-app routes that funnel toward those features:
  - handbook CTA to mock
  - topic guide CTA to topic drill
  - dashboard mock center
  - daily mission and recommendation links

Current paid-state route expectations:

- `/pricing`
  - should reflect active or trial state rather than behave like a simple upgrade wall
- `/settings`
  - shows billing state
  - sends users to `/api/portal` when billing can be managed
- `/parent/dashboard`
  - remains role-gated, not subscription-gated
  - uses plan label/callout messaging

### 7. Parent-role-specific flow

`/parent/dashboard` has an extra role check on top of auth:

1. User must be authenticated
2. `profiles.role` must be `parent`
3. If not `parent`, route redirects to `/dashboard`
4. If parent but no child, route redirects to `/dashboard/add-student`

This route also attempts to load or generate weekly reporting data and recent activity for the first child.

### 8. Dashboard-centered authenticated journey

`/dashboard` is not just a landing page; it is the main route-dispatch surface for authenticated users.

Current dashboard paths that should be audited as separate user journeys:

- daily mission completion flow
  - recommendations -> mission links -> topic practice routes
- roadmap flow
  - roadmap tabs -> practice topic routes
- diagnostics summary flow
  - dashboard diagnostic card -> `/diagnostics` or `/diagnostic`
- mock center flow
  - paid users -> `/practice/mock/Mixed`
  - free users -> `/pricing`
- onboarding modal flow
  - child without completed setup -> modal path -> dashboard continuation
- guest diagnostic claim flow
  - `ClaimResultsPrompt` on dashboard after account creation

### 9. Library-centered learning journey

The library creates its own navigation layer and should not be treated as a single page.

- `/library`
  - search/browse entry
  - handbook CTA
- `/library/handbook`
  - strategy content
  - mock CTA
- `/library/topic/[name]`
  - theory content
  - topic practice CTA
- `/library/[slug]`
  - redirect compatibility layer

### 10. Study-plan and recommendation journey

`/study-plan` is a distinct journey layer because it sends users into multiple different execution paths:

- topic practice
- mixed mock
- drill practice
- library reading

It should be audited for:

- child-required redirects
- whether linked topics actually exist
- whether free users are sent into gated mock flows without warning

### 11. Leaderboard and gamification journey

`/leaderboard` is a separate engagement route and should be audited for:

- visibility to the correct audience
- correctness of data source
- whether its CTA leads users to the most useful next step
- whether no-child or low-activity users still have a coherent follow-up path

### 12. Subscription lifecycle flow

#### Upgrade

1. User visits `/pricing`
2. User posts to `/api/checkout`
3. Stripe checkout is created
4. Stripe success returns to `/dashboard?session_id=...`
5. `/dashboard` reconciles the checkout session and redirects back to clean `/dashboard`

#### Billing management

1. User opens `/settings` or the sidebar billing action
2. If `canManageBilling(profile)` is true, the product posts to `/api/portal`
3. Stripe portal handles cancellation and billing changes

#### Downgraded states

Users with `subscription_status` of:

- `free`
- `canceled`
- `past_due`

do not have Pro access under current entitlement logic. They can still authenticate and use the app, but paid features should gate consistently.

## Current Route Truths That Matter Later

These are important current-shape notes for the logic audit:

- `/practice` is currently a direct quick-start session, not a real practice hub
- `/practice/[type]/[category]` is really several different products behind one route family:
  - topic session
  - subject drill
  - mock setup
  - mock session
- `/pricing` is not public; it requires authentication
- homepage `OnboardingPlanner` promises a more guided signup path and creates a child immediately
- direct `/signup` does not create a child
- diagnostics can exist in pre-child and pre-confirmation states before being claimed
- the parent dashboard is role-gated and child-gated
- analytics is child-gated and redirects to `/dashboard`
- mock and written practice gating rely on entitlement checks inside the session route
- some in-app routes and CTAs still imply “practice hubs” or similar capability groupings even when the destination is a direct session route
- billing portal access depends on `stripe_customer_id`, not only on subscription status
- canceled and past-due users lose Pro access because only `trialing` and `active` count as paid access
- `/auth/callback` currently redirects to `/auth/auth-code-error` on failure, but that route is not part of this journey map and should be checked later for existence and UX quality

## Later Logic Audit Checklist

The second-pass code audit should verify the following across the journeys above.

### Auth and public/private boundaries

- Public routes stay public
- Authenticated shell routes always redirect signed-out users cleanly
- Support routes do not leak users into broken states

### Child-state consistency

- No-child users see coherent empty states
- Add-child routes and redirects are consistent across dashboard, diagnostics, analytics, and parent dashboard
- Child creation paths from homepage onboarding and in-app add-student do not diverge unexpectedly

### Diagnostic-state consistency

- Guest diagnostic capture is stored consistently
- Signup, confirmation, dashboard claim, and diagnostics hub all converge on one claimed result
- No orphaned or duplicate diagnostic paths remain after claim

### Subscription-state consistency

- Free, trialing, active, canceled, and past_due users see consistent gating
- Pricing, portal, mocks, written practice, explanations, grading, referrals, and settings all agree on entitlements
- Checkout return and portal return do not strand users

### Role-state consistency

- Parent-only dashboard remains restricted to parent role
- Non-parent authenticated users are redirected consistently

### CTA and navigation consistency

- Buttons and nav links lead to the intended next step
- No labels imply a route capability the page does not actually provide
- Upgrade prompts do not add dead-end friction
- Cross-route CTAs from dashboard, study plan, library, leaderboard, and diagnostics remain meaningful for both free and paid users

## Scenario Matrix For The Later Audit

The later code audit should explicitly walk these scenarios:

1. Signed-out visitor lands on `/`, goes to `/diagnostic`, completes baseline, signs up, confirms, lands on `/dashboard`, and sees the diagnostic claimed.
2. Signed-out visitor uses `/signup` directly, confirms successfully, and reaches `/dashboard`.
3. Existing unconfirmed user uses resend flow from `/login`.
4. Existing unconfirmed user uses resend flow from `/signup?confirm=1`.
5. Existing user uses `/forgot-password` and completes `/reset-password`.
6. Free parent with no child visits `/dashboard`, `/analytics`, `/parent/dashboard`, and `/diagnostics`.
7. Free parent with child but no baseline completes the first authenticated diagnostic.
8. Free parent attempts mock practice and written practice and is gated consistently.
9. Trialing or active parent starts mock, written practice, explanation, grading, and billing portal flows.
10. Canceled or past_due user returns and sees coherent downgraded access across pricing, settings, mock access, and AI features.
11. Parent-role gating behaves correctly for `/parent/dashboard`.
12. Sidebar and route labels reflect the actual destination behaviour.
13. Dashboard daily mission, roadmap, and recommendation links all land on valid, coherent practice routes.
14. Study-plan day cards all land on valid routes and handle free-vs-paid gating coherently.
15. Library handbook and topic-guide CTAs land on the right downstream practice path.
16. Leaderboard CTA leads users to a sensible next action.
