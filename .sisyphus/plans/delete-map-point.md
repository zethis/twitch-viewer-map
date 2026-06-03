# Add Admin-Only Map Point Deletion Feature

## TL;DR

> **Quick Summary**: Add restricted delete functionality to the Twitch viewer map, allowing only an authenticated admin to remove pins. Authentication via simple password stored in environment variable, with localStorage session management and UI delete buttons in marker popups.
> 
> **Deliverables**: 
> - DELETE /api/pins/[id] API endpoint with admin password validation
> - Admin login UI component with localStorage session management
> - Delete buttons in marker popups (visible only when admin authenticated)
> - Confirmation dialog before deletion
> - Logout functionality
> - Updated .env.example
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 4 → Task 5 (verification)

---

## Context

### Original Request
User wants to add a feature that allows deleting points on the map, but this feature cannot be accessed by everyone - only by authorized admin users.

### Interview Summary
**Key Discussions**:
- **Access Control**: Simple admin password stored in environment variable (ADMIN_PASSWORD)
- **Session Management**: One-time login with password stored in localStorage
- **Delete Type**: Hard delete (permanent removal from database)
- **UI Placement**: Delete button in marker popup, only visible when logged in as admin
- **Confirmation**: Required via confirmation dialog before deletion
- **Test Strategy**: Agent-Executed QA only (no test infrastructure exists)

**Research Findings**:
- Next.js 14 App Router with TypeScript
- PostgreSQL database with simple `pins` table (id, city, username, lat, lng, created_at)
- Existing API pattern: `app/api/pins/route.ts` with GET/POST handlers
- No authentication system currently exists
- Rate limiting via IP-based `lib/rate-limit.ts` (5 req/60s)
- Map UI uses react-leaflet in `components/MapView.tsx`
- Client state management in `components/ClientPage.tsx` using useState
- Existing callback pattern: `handlePinAdded` in ClientPage.tsx:17-25

### Metis Review
**Identified Gaps** (addressed):
- **Missing callback pattern**: Need `onPinDeleted` callback from ClientPage → MapView (mirrors existing `onPinAdded` pattern)
- **Empty env var handling**: Must reject ALL requests if ADMIN_PASSWORD is unset/empty (never match empty string)
- **ID validation**: Must validate pin ID is numeric before DB query to prevent SQL injection
- **Concurrent deletion**: Handle 404 gracefully when pin already deleted
- **No custom modal needed**: Use `window.confirm()` instead of building custom component
- **Admin UI placement**: Should live inside existing ClientPage layout (absolute positioned like SubmitForm)
- **No new dependencies**: Work within existing stack
- **Acceptance criteria**: Metis provided 8 specific scenarios to verify

---

## Work Objectives

### Core Objective
Add admin-authenticated delete functionality to the Twitch viewer map, enabling removal of pins via password-protected UI controls.

### Concrete Deliverables
- `app/api/pins/[id]/route.ts` - DELETE endpoint with password validation
- `lib/admin-auth.ts` - localStorage helpers and validation utilities
- `components/AdminLogin.tsx` - Login/logout UI widget
- Updated `components/MapView.tsx` - Delete buttons in popups
- Updated `components/ClientPage.tsx` - Admin context and onPinDeleted callback
- Updated `.env.example` - ADMIN_PASSWORD documentation

### Definition of Done
- [ ] Admin can log in with password from .env, logout clears session
- [ ] Delete buttons appear in popups only when admin logged in
- [ ] Clicking delete shows confirmation dialog, successful deletion removes pin from map without reload
- [ ] DELETE API returns 401 for wrong/missing password, 404 for non-existent pin, 200 for success
- [ ] Map updates immediately after deletion via callback pattern
- [ ] All Metis acceptance criteria verified via QA scenarios

### Must Have
- Admin password validation on DELETE requests (header-based)
- localStorage-based session (no server-side sessions)
- Delete button conditional rendering based on auth state
- Confirmation before deletion (window.confirm)
- Logout functionality
- Empty ADMIN_PASSWORD env var rejection
- Numeric pin ID validation
- Callback pattern for map refresh after delete

### Must NOT Have (Guardrails)
- **No new dependencies** - Work within existing stack (no NextAuth, no modal libraries)
- **No custom modal component** - Use browser's window.confirm()
- **No new pages/routes** - Only add `app/api/pins/[id]/route.ts`
- **No modification to existing API** - Don't touch `app/api/pins/route.ts`
- **No soft delete** - Hard delete only (permanent removal)
- **No audit logging** - Simple delete without history tracking
- **No session expiry** - localStorage persists until logout
- **No role system** - Single admin level only
- **No password recovery** - Admin must have env var access
- **No separate admin panel** - Delete buttons in existing map UI only

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (no test framework)
- **Framework**: N/A
- **QA Strategy**: Agent-Executed QA Scenarios only

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API endpoints**: Use Bash (curl) - Send requests, assert status + response fields
- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **State management**: Use Bash (browser DevTools via Playwright) - Check localStorage values

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.

```
Wave 1 (Start Immediately - API + utilities foundation):
├── Task 1: DELETE /api/pins/[id]/route.ts [quick]
├── Task 2: Admin auth utilities (lib/admin-auth.ts) [quick]
└── Task 3: Admin login/logout UI component [quick]

Wave 2 (After Wave 1 - integration):
├── Task 4: MapView delete buttons + ClientPage wiring [unspecified-high]
└── Task 5: .env.example update [quick]

Wave FINAL (After ALL tasks — parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

**Critical Path**: Task 1 → Task 4 → Task F1-F4 → user okay  
**Parallel Speedup**: ~50% faster than sequential  
**Max Concurrent**: 3 (Wave 1)

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|---------|------|
| 1 | - | 4 | 1 |
| 2 | - | 3, 4 | 1 |
| 3 | 2 | 4 | 1 |
| 4 | 1, 2, 3 | F1-F4 | 2 |
| 5 | - | F1-F4 | 2 |
| F1-F4 | 1-5 | - | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3 tasks** - T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **2 tasks** - T4 → `unspecified-high`, T5 → `quick`
- **FINAL**: **4 tasks** - F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. Create DELETE API endpoint with admin authentication

  **What to do**:
  - Create new file `app/api/pins/[id]/route.ts`
  - Export async DELETE function that accepts NextRequest
  - Extract pin ID from URL params, validate it's a positive integer
  - Extract `x-admin-password` header from request
  - Check if ADMIN_PASSWORD env var is set and non-empty (reject if not)
  - Compare header value with `process.env.ADMIN_PASSWORD`
  - If unauthorized: return 401 with `{"error":"Unauthorized"}`
  - If authorized: query database `DELETE FROM pins WHERE id = $1 RETURNING id`
  - If no rows affected: return 404 with `{"error":"Pin not found"}`
  - If successful: return 200 with `{"message":"Pin deleted","id":<id>}`
  - Handle database errors with 500 response

  **Must NOT do**:
  - Don't accept empty ADMIN_PASSWORD env var as valid (always reject if unset/empty)
  - Don't skip ID validation (prevent SQL injection)
  - Don't add rate limiting (exists at higher level)
  - Don't add soft delete or audit logging

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation, straightforward CRUD operation following existing API pattern
  - **Skills**: []
    - No specialized skills needed - standard Next.js API route
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4 (MapView needs API endpoint to call)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `app/api/pins/route.ts:18-57` - POST handler pattern (request validation, error handling, database query, response format)
  - `app/api/pins/route.ts:6-15` - GET handler pattern (error handling structure)
  - `lib/db.ts` - Database pool import and usage pattern

  **API/Type References** (contracts to implement against):
  - `lib/types.ts:1-8` - Pin interface (for response typing)
  - `app/api/pins/route.ts:30-43` - Validation pattern examples (typeof checks, range validation)

  **External References** (libraries and frameworks):
  - Next.js docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments - Dynamic route segment [id] access

  **WHY Each Reference Matters**:
  - `app/api/pins/route.ts:18-57`: Shows exact error response format, status codes, database query pattern with pool.query, and try-catch structure used in this codebase
  - `lib/db.ts`: Import path and usage of the database pool
  - Dynamic route segment docs: How to extract [id] parameter from URL in App Router

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** - No human action permitted.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Successful deletion with valid admin password
    Tool: Bash (curl)
    Preconditions: 
      - Dev server running (npm run dev)
      - ADMIN_PASSWORD="testadmin123" in .env
      - At least one pin exists in database (id=1)
    Steps:
      1. curl -X DELETE http://localhost:3000/api/pins/1 -H "x-admin-password: testadmin123" -w "\nHTTP %{http_code}\n"
      2. Verify response body contains: {"message":"Pin deleted","id":1}
      3. Verify HTTP status code: 200
      4. curl http://localhost:3000/api/pins (GET all pins)
      5. Verify pin with id=1 is NOT in the list
    Expected Result: 200 status, pin removed from database, success message returned
    Failure Indicators: Status not 200, pin still exists in database, error message in response
    Evidence: .sisyphus/evidence/task-1-successful-delete.txt

  Scenario: Unauthorized deletion with wrong password
    Tool: Bash (curl)
    Preconditions:
      - Dev server running
      - ADMIN_PASSWORD="testadmin123" in .env
    Steps:
      1. curl -X DELETE http://localhost:3000/api/pins/1 -H "x-admin-password: wrongpassword" -w "\nHTTP %{http_code}\n"
      2. Verify response body contains: {"error":"Unauthorized"}
      3. Verify HTTP status code: 401
    Expected Result: 401 status, error message, no database modification
    Failure Indicators: Status not 401, pin was deleted, different error message
    Evidence: .sisyphus/evidence/task-1-unauthorized-wrong-password.txt

  Scenario: Unauthorized deletion with missing header
    Tool: Bash (curl)
    Preconditions:
      - Dev server running
      - ADMIN_PASSWORD set in .env
    Steps:
      1. curl -X DELETE http://localhost:3000/api/pins/1 -w "\nHTTP %{http_code}\n"
      2. Verify response body contains: {"error":"Unauthorized"}
      3. Verify HTTP status code: 401
    Expected Result: 401 status with unauthorized error
    Failure Indicators: Status not 401, deletion succeeds without auth
    Evidence: .sisyphus/evidence/task-1-unauthorized-missing-header.txt

  Scenario: Pin not found (404 for non-existent ID)
    Tool: Bash (curl)
    Preconditions:
      - Dev server running
      - ADMIN_PASSWORD="testadmin123" in .env
      - Pin with id=99999 does NOT exist
    Steps:
      1. curl -X DELETE http://localhost:3000/api/pins/99999 -H "x-admin-password: testadmin123" -w "\nHTTP %{http_code}\n"
      2. Verify response body contains: {"error":"Pin not found"}
      3. Verify HTTP status code: 404
    Expected Result: 404 status, error message indicating pin not found
    Failure Indicators: Status not 404, different error, 500 error
    Evidence: .sisyphus/evidence/task-1-pin-not-found.txt

  Scenario: Empty ADMIN_PASSWORD env var rejection
    Tool: Bash (curl)
    Preconditions:
      - Temporarily unset ADMIN_PASSWORD env var (or set to empty string)
      - Restart dev server
    Steps:
      1. curl -X DELETE http://localhost:3000/api/pins/1 -H "x-admin-password: anything" -w "\nHTTP %{http_code}\n"
      2. Verify response body contains: {"error":"Unauthorized"}
      3. Verify HTTP status code: 401
    Expected Result: 401 status, never matches empty env var
    Failure Indicators: Authentication succeeds, 500 error, different status
    Evidence: .sisyphus/evidence/task-1-empty-env-rejection.txt
  ```

  **Evidence to Capture:**
  - [ ] All curl outputs saved with full response body and status code
  - [ ] Verification of database state via GET /api/pins

  **Commit**: NO (groups with Wave 1)

- [x] 2. Create admin authentication utilities

  **What to do**:
  - Create new file `lib/admin-auth.ts`
  - Export `isAdminAuthenticated()` function that checks localStorage for 'admin-authenticated' key (returns boolean)
  - Export `setAdminAuthenticated(authenticated: boolean)` that sets/removes localStorage key
  - Export `validateAdminPassword(password: string): boolean` that returns true if password matches (client-side check for UX feedback)
  - Note: Real validation happens server-side; this is for UI state only
  - Add TypeScript types for clarity

  **Must NOT do**:
  - Don't store the actual password in localStorage (only boolean flag)
  - Don't implement JWT or session tokens (keep it simple)
  - Don't add expiry logic (localStorage persists until logout)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small utility file with simple localStorage wrappers, no complex logic
  - **Skills**: []
    - Standard TypeScript utilities, no special skills needed
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 3, 4 (login UI and MapView need these utilities)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `lib/rate-limit.ts` - Simple utility module structure (exports, typing)
  - `lib/types.ts` - TypeScript interface definitions pattern

  **API/Type References** (contracts to implement against):
  - Browser localStorage API - standard Web API
  - TypeScript boolean return types

  **WHY Each Reference Matters**:
  - `lib/rate-limit.ts`: Shows the codebase's style for small utility modules - simple exports, clear typing
  - No complex patterns needed - this is a straightforward localStorage wrapper

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Set and verify admin authenticated state
    Tool: Bash (node REPL to test module)
    Preconditions: File created and exports valid
    Steps:
      1. In node REPL: const auth = require('./lib/admin-auth.ts')
      2. Mock localStorage if needed for Node environment
      3. Call auth.setAdminAuthenticated(true)
      4. Call auth.isAdminAuthenticated()
      5. Verify it returns true
      6. Call auth.setAdminAuthenticated(false)
      7. Call auth.isAdminAuthenticated()
      8. Verify it returns false
    Expected Result: Functions correctly set and read localStorage state
    Failure Indicators: Returns wrong boolean, localStorage not updated, TypeScript errors
    Evidence: .sisyphus/evidence/task-2-auth-state-management.txt

  Scenario: Password validation function exists
    Tool: Bash (grep + TypeScript check)
    Preconditions: File created
    Steps:
      1. grep "validateAdminPassword" lib/admin-auth.ts
      2. Verify function is exported
      3. Run tsc --noEmit to verify no TypeScript errors
    Expected Result: Function exported, types valid, no compile errors
    Failure Indicators: Function missing, type errors, module doesn't compile
    Evidence: .sisyphus/evidence/task-2-password-validation-export.txt
  ```

  **Evidence to Capture:**
  - [ ] Module exports verified
  - [ ] TypeScript compilation success

  **Commit**: NO (groups with Wave 1)

---

- [x] 3. Create admin login/logout UI component

  **What to do**:
  - Create new file `components/AdminLogin.tsx`
  - Create a client component ('use client' directive)
  - State: password input, isAuthenticated (from lib/admin-auth), error message
  - If not authenticated: show password input + "Login" button
  - On login submit: call /api/pins/[id] with password header to verify (or call a simple validation endpoint)
  - Actually, simpler: just set localStorage directly since validation happens per-request on server
  - If authenticated: show "Logged in as Admin" message + "Logout" button
  - On logout: call setAdminAuthenticated(false) and clear state
  - Style to match existing SubmitForm aesthetic (absolute positioned in ClientPage)
  - Use simple styling, avoid complex UI libraries

  **Must NOT do**:
  - Don't create custom modal components (use simple div/form)
  - Don't install new dependencies for styling
  - Don't add password recovery features
  - Don't implement session expiry

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple form component, straightforward state management, minimal logic
  - **Skills**: []
    - Standard React component, no complex patterns needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Too simple for UI specialist, basic form only

  **Parallelization**:
  - **Can Run In Parallel**: NO (after Task 2)
  - **Parallel Group**: Wave 1 (but depends on Task 2 completing first)
  - **Blocks**: Task 4 (ClientPage needs to import this component)
  - **Blocked By**: Task 2 (needs admin-auth utilities)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `components/SubmitForm.tsx` - Component structure, styling approach, form handling patterns
  - `components/ClientPage.tsx:30-39` - Absolute positioning style for UI widgets

  **API/Type References** (contracts to implement against):
  - `lib/admin-auth.ts` - isAdminAuthenticated(), setAdminAuthenticated() functions (created in Task 2)

  **WHY Each Reference Matters**:
  - `components/SubmitForm.tsx`: Shows existing form component patterns, error handling, styling conventions, how forms integrate with state
  - `components/ClientPage.tsx:30-39`: Exact styling pattern for absolutely positioned UI elements (top, left, zIndex)
  - Must use same aesthetic so UI looks cohesive

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Login UI renders and sets authenticated state
    Tool: Playwright (playwright skill)
    Preconditions:
      - Dev server running
      - Navigate to http://localhost:3000
      - Admin not logged in
    Steps:
      1. page.goto('http://localhost:3000')
      2. await page.locator('input[type="password"]').waitFor()
      3. await page.locator('input[type="password"]').fill('testpass')
      4. await page.locator('button:has-text("Login")').click()
      5. Check localStorage: await page.evaluate(() => localStorage.getItem('admin-authenticated'))
      6. Verify value is 'true'
      7. Verify "Logged in as Admin" text appears
      8. Verify "Logout" button appears
    Expected Result: Login sets localStorage, UI shows logged-in state
    Failure Indicators: localStorage not set, UI doesn't update, button missing
    Evidence: .sisyphus/evidence/task-3-login-flow.png (screenshot)

  Scenario: Logout clears authenticated state
    Tool: Playwright
    Preconditions:
      - Logged in from previous scenario
    Steps:
      1. await page.locator('button:has-text("Logout")').click()
      2. Check localStorage: await page.evaluate(() => localStorage.getItem('admin-authenticated'))
      3. Verify value is null or 'false'
      4. Verify password input and "Login" button reappear
    Expected Result: Logout clears localStorage, UI shows logged-out state
    Failure Indicators: localStorage not cleared, UI doesn't revert, login form missing
    Evidence: .sisyphus/evidence/task-3-logout-flow.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshots of login/logout UI states
  - [ ] localStorage state verification via DevTools

  **Commit**: NO (groups with Wave 1)

- [x] 4. Add delete buttons to MapView and wire ClientPage callback

  **What to do**:
  - Update `components/MapView.tsx`:
    - Import isAdminAuthenticated from lib/admin-auth
    - Add useState hook to track isAdmin (check on mount with useEffect)
    - In Popup component for each marker, conditionally render a "Delete" button if isAdmin is true
    - Add onClick handler to delete button that calls onDeletePin(pin.id) prop callback
    - Use window.confirm() for confirmation dialog: "Are you sure you want to delete this pin?"
    - Only proceed with delete if user confirms
  - Update `components/ClientPage.tsx`:
    - Create handlePinDeleted callback similar to handlePinAdded (lines 17-25)
    - In delete handler: fetch DELETE /api/pins/[id] with x-admin-password header from localStorage
    - After successful delete, refetch pins via GET /api/pins and update state
    - Pass onDeletePin={handlePinDeleted} prop to MapView
    - Import and render AdminLogin component (position absolutely like SubmitForm, but top-right)
  - Ensure delete button styling is simple and clear
  - Handle errors gracefully (show alert if delete fails)

  **Must NOT do**:
  - Don't create custom modal component for confirmation (use window.confirm)
  - Don't add edit functionality (only delete)
  - Don't add bulk delete
  - Don't modify MapView's other functionality

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file changes, state management, callback wiring, UI integration - moderate complexity
  - **Skills**: []
    - Standard React patterns, no specialized skills needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not complex enough for UI specialist, straightforward state/callback work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Wave 1 completes)
  - **Blocks**: Tasks F1-F4 (final verification)
  - **Blocked By**: Tasks 1, 2, 3 (needs API endpoint, auth utils, login component)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `components/ClientPage.tsx:17-25` - handlePinAdded callback pattern (fetch, setPins, error handling)
  - `components/ClientPage.tsx:30-39` - SubmitForm positioning pattern (for AdminLogin placement)
  - `components/MapView.tsx:32-40` - Marker and Popup structure (where to add delete button)
  - `components/SubmitForm.tsx` - If exists, shows form/button styling patterns

  **API/Type References** (contracts to implement against):
  - `lib/admin-auth.ts` - isAdminAuthenticated() function
  - `app/api/pins/[id]/route.ts` - DELETE endpoint (created in Task 1) - expects x-admin-password header
  - `lib/types.ts:1-8` - Pin interface

  **External References** (libraries and frameworks):
  - window.confirm() - MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm
  - React useEffect hook for auth state initialization
  - react-leaflet Popup component docs for button placement

  **WHY Each Reference Matters**:
  - `ClientPage.tsx:17-25`: Exact pattern to follow for handlePinDeleted - fetch, state update, error handling
  - `MapView.tsx:32-40`: Shows where to add delete button (inside Popup component), how markers are structured
  - Must match existing callback pattern so state management is consistent

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Delete button appears only when admin logged in
    Tool: Playwright (playwright skill)
    Preconditions:
      - Dev server running
      - ADMIN_PASSWORD="testadmin123" in .env
      - At least one pin visible on map
    Steps:
      1. page.goto('http://localhost:3000')
      2. Click on a map marker to open popup
      3. Verify NO delete button exists in popup
      4. Log in as admin (use AdminLogin component)
      5. Click on the same marker again
      6. await page.locator('button:has-text("Delete")').waitFor()
      7. Verify delete button IS visible in popup
    Expected Result: Delete button only visible when admin authenticated
    Failure Indicators: Button always visible, button never visible, authentication doesn't toggle visibility
    Evidence: .sisyphus/evidence/task-4-delete-button-visibility.png

  Scenario: Successful pin deletion with confirmation
    Tool: Playwright
    Preconditions:
      - Logged in as admin
      - At least one pin exists (id=1, city="TestCity")
    Steps:
      1. Count pins on map: const initialCount = await page.locator('.leaflet-marker-icon').count()
      2. Click on marker for pin id=1
      3. Click delete button in popup
      4. window.confirm will appear - accept it (page.on('dialog', dialog => dialog.accept()))
      5. Wait for map to update (waitForResponse on GET /api/pins)
      6. const newCount = await page.locator('.leaflet-marker-icon').count()
      7. Verify newCount === initialCount - 1
      8. Verify marker for "TestCity" is gone
    Expected Result: Confirmation dialog shows, pin removed from map without page reload
    Failure Indicators: No confirmation, pin not removed, page reloads, error displayed
    Evidence: .sisyphus/evidence/task-4-successful-deletion.png

  Scenario: Cancelled deletion (user clicks Cancel on confirm)
    Tool: Playwright
    Preconditions:
      - Logged in as admin
      - Pin exists
    Steps:
      1. Count pins: const count = await page.locator('.leaflet-marker-icon').count()
      2. Click marker, click delete button
      3. Dismiss confirmation dialog: page.on('dialog', dialog => dialog.dismiss())
      4. Wait 2 seconds
      5. Verify pin count unchanged
      6. Verify pin still visible on map
    Expected Result: Cancelling confirmation leaves pin intact
    Failure Indicators: Pin deleted anyway, error thrown, UI breaks
    Evidence: .sisyphus/evidence/task-4-cancelled-deletion.png

  Scenario: Error handling for unauthorized delete
    Tool: Playwright
    Preconditions:
      - Logged in but localStorage has wrong password value (simulate corruption)
    Steps:
      1. page.evaluate(() => localStorage.setItem('admin-authenticated', 'wrong'))
      2. Click marker, click delete
      3. Accept confirmation
      4. Wait for error alert or message
      5. Verify pin NOT deleted from map
    Expected Result: Error displayed, pin remains on map
    Failure Indicators: Pin deleted, no error shown, app crashes
    Evidence: .sisyphus/evidence/task-4-error-handling.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshots of UI states (logged out, logged in, delete button visible)
  - [ ] Network request logs showing DELETE call with header
  - [ ] Map state before/after deletion

  **Commit**: NO (groups with Wave 2)

- [x] 5. Update .env.example with ADMIN_PASSWORD

  **What to do**:
  - Open `.env.example`
  - Add new line: `ADMIN_PASSWORD=your_secure_password_here`
  - Add comment above explaining purpose: "# Admin password for deleting map pins"

  **Must NOT do**:
  - Don't put actual password in .env.example (placeholder only)
  - Don't commit actual .env file

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Trivial single-line addition to config file
  - **Skills**: []
    - No skills needed
  - **Skills Evaluated but Omitted**:
    - All - too simple to need any skills

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks F1-F4 (final verification)
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `.env.example:1-4` - Existing format and comment style

  **WHY Each Reference Matters**:
  - Shows exact format to match (KEY=value, comments with #)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: .env.example updated correctly
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep "ADMIN_PASSWORD" .env.example
      2. Verify line exists
      3. Verify format matches: ADMIN_PASSWORD=your_secure_password_here
      4. Verify comment line exists above it
    Expected Result: Entry present, properly formatted, documented
    Failure Indicators: Missing entry, wrong format, no comment
    Evidence: .sisyphus/evidence/task-5-env-example-updated.txt
  ```

  **Evidence to Capture:**
  - [ ] grep output showing the new line

  **Commit**: NO (groups with Wave 2)

---

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. **Plan Compliance Audit** — `oracle`
  
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  
  Run `npm run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod code, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: full flow from login → delete → logout. Test edge cases: wrong password, non-existent pin, concurrent delete. Save to `.sisyphus/evidence/final-qa/`.
  
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  
  For each task: read "What to do", read actual diff (git diff feature/delete-map-point). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect unaccounted changes.
  
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 complete**: `feat(api): add admin-authenticated delete endpoint` - app/api/pins/[id]/route.ts, lib/admin-auth.ts, components/AdminLogin.tsx
- **Wave 2 complete**: `feat(ui): add delete buttons to map markers` - components/MapView.tsx, components/ClientPage.tsx, .env.example
- **All F tasks approved**: `chore: final verification complete`

---

## Success Criteria

### Verification Commands
```bash
# Start dev server
npm run dev

# API tests (in separate terminal)
curl -X DELETE http://localhost:3000/api/pins/1 -H "x-admin-password: wrong"
# Expected: {"error":"Unauthorized"} with status 401

curl -X DELETE http://localhost:3000/api/pins/99999 -H "x-admin-password: correctpass"
# Expected: {"error":"Pin not found"} with status 404

curl -X DELETE http://localhost:3000/api/pins/1 -H "x-admin-password: correctpass"
# Expected: {"message":"Pin deleted","id":1} with status 200
```

### Final Checklist
- [ ] All "Must Have" present (verified in F1)
- [ ] All "Must NOT Have" absent (verified in F1)
- [ ] Admin can login, delete pins, logout (verified in F3)
- [ ] API rejects unauthorized requests (verified in F3)
- [ ] Map updates without page reload after delete (verified in F3)
- [ ] Evidence files exist for all QA scenarios (verified in F1, F3)
