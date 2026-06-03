# Twitch Viewer Map

## TL;DR

> **Quick Summary**: Build a Next.js web app where Twitch viewers can enter their city and appear as a pin on an OpenStreetMap. Pins persist forever in a PostgreSQL database. Deployed via Docker Compose.
>
> **Deliverables**:
> - Next.js App Router project with Docker Compose (app + postgres)
> - `GET /api/pins` — returns all pins as JSON
  > - `POST /api/pins` — accepts `{city, username?, lat, lng}` (lat/lng pre-resolved client-side via `/api/geocode`), stores pin, returns created pin
> - `GET /api/geocode?q=` — proxy to Nominatim autocomplete with debounce support
> - Map page: Leaflet map (OpenStreetMap tiles) with one marker per pin
> - Submission form: city autocomplete + optional username + submit button
> - Rate limiting: 5 POST submissions per IP per minute
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 6 → Task 8 → Task 9 → F1-F4

---

## Context

### Original Request
Viewer location map for a Twitch channel — viewers enter their city, get shown as a pin on OpenStreetMap.

### Interview Summary
**Key Discussions**:
- **Location input**: City name text search with autocomplete (Nominatim)
- **Viewer identity**: Optional username, city only (no full address)
- **Persistence**: Forever in PostgreSQL
- **Tech**: Next.js + PostgreSQL, Docker deployment
- **Real-time**: No — manual refresh only
- **Admin/moderation**: None needed
- **Tests**: No automated tests — agent-executed QA scenarios only

**Research Findings**:
- Nominatim (OSM) has a 1 req/sec policy — autocomplete MUST be debounced client-side (300ms+)
- Geocoding result (lat/lng) stored at submission time — never re-geocode on read
- react-leaflet for map rendering with OpenStreetMap tiles
- Disambiguated autocomplete results required (city + region + country)

### Metis Review
**Identified Gaps** (addressed):
- Rate limiting on POST endpoint → included (5 per IP/minute, in-memory Map)
- Duplicate submissions → second pin allowed (user moved cities), no dedup
- Nominatim rate limit → 300ms client debounce mandated
- Disambiguated city names → Nominatim `display_name` used in autocomplete
- Empty map state → helpful message when no pins exist
- Username char limit → max 25 characters enforced

---

## Work Objectives

### Core Objective
A publicly accessible web page where Twitch viewers submit their city, optionally their username, and see themselves pinned on a world OpenStreetMap alongside all other viewers.

### Concrete Deliverables
- `docker-compose.yml` — orchestrates `app` (Next.js, port 3000) + `db` (PostgreSQL, port 5432)
- `Dockerfile` — multi-stage Next.js build
- `.env.example` — documents required env vars
- `app/api/pins/route.ts` — GET (all pins) + POST (create pin with geocoding)
- `app/api/geocode/route.ts` — Nominatim autocomplete proxy
- `app/page.tsx` — main page: Leaflet map + submission form
- `lib/db.ts` — PostgreSQL connection (raw `pg`)
- `lib/rate-limit.ts` — simple in-memory IP rate limiter
- `db/init.sql` — schema creation (pins table)

### Definition of Done
- [ ] `docker compose up` starts cleanly, app responds on `http://localhost:3000`
- [ ] `curl -X POST http://localhost:3000/api/pins -H 'Content-Type: application/json' -d '{"city":"Paris, Île-de-France, France","lat":48.8566,"lng":2.3522}'` → 201 with `{id, city, username, lat, lng, created_at}`
- [ ] `curl http://localhost:3000/api/pins` → JSON array including submitted pin
- [ ] Leaflet map renders with `.leaflet-marker-icon` elements visible (Playwright)
- [ ] Submitting empty city returns 400 error

### Must Have
- City-level geocoding only (not full address precision)
- lat/lng stored in DB at submission time — never re-geocode on GET
- Autocomplete debounced 300ms minimum
- Disambiguated city suggestions (city + region + country from Nominatim `display_name`)
- Rate limiting: 5 POST per IP per minute (in-memory)
- Username capped at 25 characters
- Empty map state shows a helpful message
- `docker compose up` is the only required start command

### Must NOT Have (Guardrails)
- No WebSockets, SSE, or real-time updates of any kind
- No user authentication or sessions
- No streamer admin panel or analytics dashboard
- No pin deletion/editing by viewers
- No pin clustering or custom marker icons
- No map theme/color customization UI
- No Twitch API integration (standalone web form only)
- No CI/CD, monitoring setup, or SSL termination (Docker Compose only)
- No test framework or test files
- No self-hosted Nominatim — use public API with debounce
- No image/avatar uploads
- No fallback geocoding provider

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

- **Frontend/UI**: Playwright — navigate, interact, assert DOM, screenshot
- **API/Backend**: Bash (curl) — send requests, assert status + response fields
- **Docker**: Bash — `docker compose up`, `docker ps`, `curl`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — infrastructure + types):
├── Task 1: Docker Compose + Dockerfile + .env.example [quick]
├── Task 2: Next.js project scaffolding + package.json [quick]
├── Task 3: Database schema (db/init.sql + lib/db.ts) [quick]
└── Task 4: Shared TypeScript types (lib/types.ts) [quick]

Wave 2 (After Wave 1 — API routes):
├── Task 5: GET + POST /api/pins route handler [unspecified-high]
├── Task 6: GET /api/geocode route handler (Nominatim proxy) [quick]
└── Task 7: In-memory rate limiter (lib/rate-limit.ts) [quick]

Wave 3 (After Wave 2 — frontend):
├── Task 8: Leaflet map component (MapView) [visual-engineering]
└── Task 9: Submission form + autocomplete + main page assembly [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA — docker compose + browser (unspecified-high + playwright skill)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

**Critical Path**: Task 1 → Task 3 → Task 5 → Task 8 → Task 9 → F1-F4
**Parallel Speedup**: ~60% faster than sequential
**Max Concurrent**: 4 (Wave 1)

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2, 3, 4 |
| 2 | 1 | 5, 6, 7, 8, 9 |
| 3 | 1 | 5 |
| 4 | 1 | 5, 6, 8, 9 |
| 5 | 2, 3, 4, 7 | F1-F4 |
| 6 | 2, 4 | 9 |
| 7 | 2 | 5 |
| 8 | 2, 4 | 9 |
| 9 | 2, 4, 6, 8 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → T1-T4 all `quick`
- **Wave 2**: 3 tasks → T5 `unspecified-high`, T6-T7 `quick`
- **Wave 3**: 2 tasks → T8-T9 `visual-engineering`
- **FINAL**: 4 tasks → F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. Docker Compose + Dockerfile + .env.example

  **What to do**:
  - Create `docker-compose.yml` with two services: `app` (Next.js, port 3000) and `db` (postgres:16-alpine, port 5432)
  - `db` service mounts `./db/init.sql` as an init script so the schema is created on first start
  - `db` service uses a named volume `pgdata` for persistence
  - `app` service depends on `db`, sets `DATABASE_URL` env var
  - Create `Dockerfile` — multi-stage: `node:20-alpine` builder + slim runner
    - Stage 1: `npm ci`, `npm run build`
    - Stage 2: copy `.next/standalone`, expose 3000, `CMD ["node", "server.js"]`
  - Create `.env.example`:
    ```
    DATABASE_URL=postgresql://viewer_map:viewer_map@db:5432/viewer_map
    POSTGRES_USER=viewer_map
    POSTGRES_PASSWORD=viewer_map
    POSTGRES_DB=viewer_map
    ```
  - Create `.env` (gitignored) with those same values for local dev

  **Must NOT do**:
  - No Nginx reverse proxy, no SSL termination
  - No CI/CD config files (.github/workflows, etc.)
  - No healthcheck complexity — `depends_on: db` with `condition: service_started` is fine

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config file writing, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 2, 3, 4 (they need the project root structure)
  - **Blocked By**: None (start immediately)

  **References**:
  - Next.js standalone output docs: `https://nextjs.org/docs/app/api-reference/next-config-js/output`
  - Docker multi-stage build docs: `https://docs.docker.com/build/building/multi-stage/`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Docker Compose starts cleanly
    Tool: Bash
    Preconditions: Docker daemon running, port 3000 + 5432 free
    Steps:
      1. Run: docker compose up -d
      2. Run: docker ps | grep twitch-viewer-map
      3. Assert: both "app" and "db" containers show "Up" status
      4. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
      5. Assert: HTTP 200 (Next.js default page)
    Expected Result: Both containers running, app responds on port 3000
    Evidence: .sisyphus/evidence/task-1-docker-start.txt

  Scenario: .env.example contains all required variables
    Tool: Bash
    Steps:
      1. Run: cat .env.example
      2. Assert: contains DATABASE_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
    Expected Result: All 4 vars present
    Evidence: .sisyphus/evidence/task-1-env-example.txt
  ```

  **Commit**: YES (group with Tasks 2, 3, 4)
  - Message: `chore: docker + db schema + project scaffold`

- [x] 2. Next.js project scaffolding

  **What to do**:
  - Initialize a Next.js 14+ App Router project: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"`
  - Update `next.config.ts`:
    - Add `output: 'standalone'` for Docker
    - Add `images: { unoptimized: true }` (no image optimization needed)
  - Install dependencies: `npm install pg react-leaflet leaflet`
  - Install dev dependencies: `npm install -D @types/pg @types/leaflet`
  - Add `.gitignore` entry for `.env`
  - Verify `package.json` has `build`, `start`, `dev` scripts

  **Must NOT do**:
  - No extra UI libraries (no shadcn, no MUI, no Radix) — plain Tailwind only
  - No state management libraries (no Redux, no Zustand)
  - No ORM (no Prisma, no Drizzle) — use raw `pg`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1, with Tasks 1, 3, 4) — but if running truly parallel, Task 2 can start after Task 1 creates the root dir
  - **Blocks**: Tasks 5, 6, 7, 8, 9
  - **Blocked By**: Task 1 (needs project root)

  **References**:
  - Next.js App Router: `https://nextjs.org/docs/app`
  - react-leaflet docs: `https://react-leaflet.js.org/docs/start-installation/`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Next.js dev server starts
    Tool: Bash
    Steps:
      1. Run: npm run dev &
      2. Wait 5s
      3. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
      4. Assert: HTTP 200
    Expected Result: Dev server responds
    Evidence: .sisyphus/evidence/task-2-dev-start.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0, .next/standalone directory exists
    Expected Result: Standalone build artifacts present
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (group with Tasks 1, 3, 4)

- [x] 3. Database schema (db/init.sql + lib/db.ts)

  **What to do**:
  - Create `db/init.sql`:
    ```sql
    CREATE TABLE IF NOT EXISTS pins (
      id          SERIAL PRIMARY KEY,
      city        VARCHAR(255) NOT NULL,
      username    VARCHAR(25),
      lat         DOUBLE PRECISION NOT NULL,
      lng         DOUBLE PRECISION NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    ```
  - Create `lib/db.ts` — exports a singleton `pg.Pool` using `DATABASE_URL` from env:
    ```typescript
    import { Pool } from 'pg'
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    export default pool
    ```
  - The Pool is created once at module load — no connection management needed per request

  **Must NOT do**:
  - No ORM, no migration tool — raw SQL init script only
  - No extra indexes (table will be small)
  - No soft-delete or updated_at columns

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - `pg` Pool docs: `https://node-postgres.com/apis/pool`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Schema applied via Docker init
    Tool: Bash
    Preconditions: docker compose up -d has been run
    Steps:
      1. Run: docker compose exec db psql -U viewer_map -d viewer_map -c "\dt"
      2. Assert: output includes "pins" in the table list
      3. Run: docker compose exec db psql -U viewer_map -d viewer_map -c "\d pins"
      4. Assert: output includes columns "id", "city", "username", "lat", "lng", "created_at"
    Expected Result: pins table exists with correct schema
    Evidence: .sisyphus/evidence/task-3-schema.txt

  Scenario: App connects to DB successfully
    Tool: Bash
    Steps:
      1. Run: curl -s http://localhost:3000/api/pins
      2. Assert: HTTP 200 and response is a JSON array (not an error)
    Expected Result: API responds, confirming DB connection works
    Evidence: .sisyphus/evidence/task-3-pool.txt
  ```

  **Commit**: YES (group with Tasks 1, 2, 4)

- [x] 4. Shared TypeScript types (lib/types.ts)

  **What to do**:
  - Create `lib/types.ts` with these exported types:
    ```typescript
    export interface Pin {
      id: number
      city: string
      username: string | null
      lat: number
      lng: number
      created_at: string
    }

    export interface CreatePinBody {
      city: string
      username?: string
      lat: number
      lng: number
    }

    export interface GeocodeResult {
      display_name: string
      lat: string
      lon: string
    }
    ```
  - These types are used by both API routes and the frontend

  **Must NOT do**:
  - No Zod schemas (no runtime validation library)
  - No extra type complexity — keep flat and simple

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Tasks 5, 6, 8, 9
  - **Blocked By**: Task 1

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Types compile without errors
    Tool: Bash
    Steps:
      1. Run: npx tsc --noEmit
      2. Assert: exit code 0, no output
    Expected Result: TypeScript compiles cleanly with shared types
    Evidence: .sisyphus/evidence/task-4-tsc.txt
  ```

  **Commit**: YES (group with Tasks 1, 2, 3)

- [x] 5. GET + POST /api/pins route handler

  **What to do**:
  - Create `app/api/pins/route.ts` with two exports: `GET` and `POST`

  **GET handler**:
  - Query: `SELECT id, city, username, lat, lng, created_at FROM pins ORDER BY created_at DESC`
  - Return: `NextResponse.json(rows)` with status 200

  **POST handler**:
  - Parse request body: `{city, username?, lat, lng}` — note: lat/lng come from the client (geocoded on the client via the `/api/geocode` proxy, then sent here)
  - Validate:
    - `city`: required, non-empty string, max 255 chars
    - `username`: optional, max 25 chars; if present and empty string, treat as null
    - `lat`: required, number between -90 and 90
    - `lng`: required, number between -180 and 180
  - Return 400 with `{error: "..."}` if validation fails
  - Apply rate limiter: `checkRateLimit(request)` from `lib/rate-limit.ts` → return 429 if exceeded
  - Insert: `INSERT INTO pins (city, username, lat, lng) VALUES ($1, $2, $3, $4) RETURNING *`
  - Return: `NextResponse.json(row, {status: 201})`
  - Catch DB errors → return 500 with `{error: "Internal server error"}`

  **Must NOT do**:
  - No geocoding in the API route — lat/lng come from client (already resolved via `/api/geocode`)
  - No deduplication logic
  - No authentication checks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple concerns — validation, rate limiting, DB interaction, error handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, with Tasks 6 and 7)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: Tasks 2, 3, 4, 7

  **References**:
  - `lib/db.ts` — Pool import
  - `lib/types.ts` — `Pin`, `CreatePinBody` types
  - `lib/rate-limit.ts` — `checkRateLimit` function
  - Next.js Route Handlers: `https://nextjs.org/docs/app/building-your-application/routing/route-handlers`
  - `pg` parameterized queries: `https://node-postgres.com/features/queries`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: GET /api/pins returns empty array initially
    Tool: Bash
    Steps:
      1. Run: curl -s http://localhost:3000/api/pins
      2. Assert: response is JSON array "[]"
    Expected Result: 200 with empty array
    Evidence: .sisyphus/evidence/task-5-get-empty.txt

  Scenario: POST /api/pins creates a pin
    Tool: Bash
    Steps:
      1. Run: curl -s -X POST http://localhost:3000/api/pins \
           -H 'Content-Type: application/json' \
           -d '{"city":"Lyon, Auvergne-Rhône-Alpes, France","username":"Viewer42","lat":45.7578,"lng":4.8320}'
      2. Assert: HTTP 201
      3. Assert: response JSON contains "id", "city":"Lyon, Auvergne-Rhône-Alpes, France", "lat":45.7578, "lng":4.8320
    Expected Result: Pin created and returned with all fields
    Evidence: .sisyphus/evidence/task-5-post-success.txt

  Scenario: POST /api/pins with missing city returns 400
    Tool: Bash
    Steps:
      1. Run: curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/pins \
           -H 'Content-Type: application/json' \
           -d '{"lat":45.7578,"lng":4.8320}'
      2. Assert: HTTP status 400
      3. Assert: response JSON contains "error" field
    Expected Result: 400 Bad Request with error message
    Evidence: .sisyphus/evidence/task-5-post-validation.txt

  Scenario: Rate limiter returns 429 after 5 rapid POSTs
    Tool: Bash
    Steps:
      1. Run 6 sequential POSTs with valid bodies from same IP in <60s
      2. Assert: 6th request returns HTTP 429
    Expected Result: Rate limit enforced
    Evidence: .sisyphus/evidence/task-5-rate-limit.txt
  ```

  **Commit**: YES (group with Tasks 6, 7)
  - Message: `feat(api): pins CRUD + geocode proxy + rate limiting`

- [x] 6. GET /api/geocode route handler (Nominatim proxy)

  **What to do**:
  - Create `app/api/geocode/route.ts` with a `GET` handler
  - Read query param `q` from `request.nextUrl.searchParams`
  - If `q` is missing or shorter than 2 characters → return `[]` (empty array, 200)
  - Fetch from Nominatim: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`
  - **MUST** set the `User-Agent` header on the fetch call: `"twitch-viewer-map/1.0"` (Nominatim requires this)
  - Map the Nominatim response to `GeocodeResult[]`: `{display_name, lat, lon}`
  - Return: `NextResponse.json(results)` with status 200
  - On fetch failure → return 502 with `{error: "Geocoding unavailable"}`

  **Must NOT do**:
  - No caching of geocode results
  - No alternative geocoding provider as fallback
  - Do NOT expose Nominatim directly from the client — always go through this proxy

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: Task 9 (autocomplete uses this endpoint)
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `lib/types.ts` — `GeocodeResult` type
  - Nominatim search API: `https://nominatim.org/release-docs/latest/api/Search/`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Geocode returns results for valid city
    Tool: Bash
    Steps:
      1. Run: curl -s "http://localhost:3000/api/geocode?q=Berlin"
      2. Assert: HTTP 200
      3. Assert: response is JSON array with at least 1 item
      4. Assert: first item has "display_name", "lat", "lon" fields
    Expected Result: Nominatim results proxied successfully
    Evidence: .sisyphus/evidence/task-6-geocode-valid.txt

  Scenario: Short query returns empty array
    Tool: Bash
    Steps:
      1. Run: curl -s "http://localhost:3000/api/geocode?q=B"
      2. Assert: response is "[]"
    Expected Result: No Nominatim call for <2 char queries
    Evidence: .sisyphus/evidence/task-6-geocode-short.txt
  ```

  **Commit**: YES (group with Tasks 5, 7)

- [x] 7. In-memory rate limiter (lib/rate-limit.ts)

  **What to do**:
  - Create `lib/rate-limit.ts` exporting a single function: `checkRateLimit(request: Request): boolean`
  - Returns `true` if rate limit exceeded, `false` if request is allowed
  - Implementation: `Map<string, {count: number, resetAt: number}>`
    - Key = client IP (from `x-forwarded-for` header or `"unknown"`)
    - Limit: 5 requests per 60 seconds per IP
    - If `resetAt` is in the past, reset count to 1 and set new `resetAt`
    - If count ≥ 5, return `true` (exceeded)
    - Otherwise increment count, return `false`
  - This is intentionally simple — no Redis, no persistence across restarts

  **Must NOT do**:
  - No external dependencies (no `express-rate-limit`, no Redis)
  - No persistence — in-memory only is fine for this scale

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, with Tasks 5, 6)
  - **Blocks**: Task 5 (POST handler imports it)
  - **Blocked By**: Task 2

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: First 5 POST requests are allowed
    Tool: Bash
    Preconditions: App running on localhost:3000, fresh rate-limit window (wait 60s or restart app)
    Steps:
      1. Run 5 sequential POST requests to /api/pins with valid body:
         for i in 1 2 3 4 5; do
           curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/pins \
             -H 'Content-Type: application/json' \
             -d "{\"city\":\"City$i\",\"lat\":$i,\"lng\":$i}"
         done
      2. Assert: all 5 return HTTP 201
    Expected Result: All 5 submissions accepted
    Evidence: .sisyphus/evidence/task-7-rate-allow.txt

  Scenario: 6th POST in the same window returns 429
    Tool: Bash
    Preconditions: Immediately after the 5 requests above (same 60s window)
    Steps:
      1. Run: curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/pins \
           -H 'Content-Type: application/json' \
           -d '{"city":"ExtraCity","lat":10,"lng":10}'
      2. Assert: HTTP status is 429
    Expected Result: Rate limit enforced on 6th request
    Evidence: .sisyphus/evidence/task-7-rate-block.txt
  ```

  **Commit**: YES (group with Tasks 5, 6)

- [x] 8. Leaflet map component (components/MapView.tsx)

  **What to do**:
  - Create `components/MapView.tsx` — a **client component** (`'use client'`)
  - Props: `pins: Pin[]`
  - Use `react-leaflet`: `MapContainer`, `TileLayer`, `Marker`, `Popup`
  - Map config:
    - Default center: `[20, 0]` (world overview)
    - Default zoom: `2`
    - Style: `height: "100vh", width: "100%"` (full viewport)
  - TileLayer URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - Attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`
  - For each pin: `<Marker position={[pin.lat, pin.lng]}><Popup>{pin.username ?? "Anonymous"} — {pin.city}</Popup></Marker>`
  - If `pins.length === 0`: render the map but overlay a centered message: `"No viewers yet — be the first to add your location!"`
  - **IMPORTANT**: Leaflet requires the CSS import. Add to the component: `import 'leaflet/dist/leaflet.css'`
  - Fix Leaflet's default icon broken in webpack: import `L` from `leaflet` and set `L.Icon.Default.mergeOptions` with the icon URLs pointing to `/leaflet/` (copy leaflet marker PNGs to `public/leaflet/`)
  - The component must be dynamically imported in `app/page.tsx` with `ssr: false` (Leaflet is browser-only)

  **Must NOT do**:
  - No marker clustering (no `react-leaflet-cluster`)
  - No custom marker icons
  - No map theme switching

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: React component with CSS, map library, visual layout
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, with Task 9)
  - **Blocks**: Task 9 (page imports MapView)
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `lib/types.ts` — `Pin` type
  - react-leaflet docs: `https://react-leaflet.js.org/docs/api-map/`
  - Leaflet default icon fix: `https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: Map renders with markers in browser
    Tool: Playwright
    Preconditions: At least one pin exists in DB (from Task 5 QA)
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for selector: .leaflet-container (timeout: 10s)
      3. Assert: .leaflet-container is visible
      4. Assert: .leaflet-marker-icon count >= 1
      5. Screenshot: full page
    Expected Result: Map visible with at least one marker
    Evidence: .sisyphus/evidence/task-8-map-markers.png

  Scenario: Empty map shows helpful message
    Tool: Playwright
    Preconditions: DB is empty (or reset)
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for .leaflet-container
      3. Assert: page contains text "No viewers yet"
    Expected Result: Empty state message visible
    Evidence: .sisyphus/evidence/task-8-map-empty.png
  ```

  **Commit**: YES (group with Task 9)
  - Message: `feat(ui): leaflet map + submission form with autocomplete`

- [x] 9. Submission form + autocomplete + main page assembly

  **What to do**:
  - Create `components/SubmitForm.tsx` — a client component
  - State: `query` (string), `suggestions` (GeocodeResult[]), `selected` (GeocodeResult | null), `username` (string), `loading` (bool), `success` (bool), `error` (string | null)
  - **Autocomplete behavior**:
    - `<input type="text">` for city search, controlled by `query`
    - On `query` change: debounce 300ms, then fetch `/api/geocode?q=${query}` if length >= 2
    - Show dropdown of `suggestions` — each shows `result.display_name`
    - On select: set `selected = result`, set `query = result.display_name`, hide dropdown
  - **Username input**: `<input type="text" maxLength={25}>` for optional username
  - **Submit button**: disabled if no `selected`
  - **Submit handler**:
    - POST to `/api/pins` with `{city: selected.display_name, username: username || undefined, lat: parseFloat(selected.lat), lng: parseFloat(selected.lon)}`
    - On 201: show success message "You've been added to the map!", clear form, reload pins
    - On error: show error message from response
    - On 429: show "Too many submissions — please wait a minute"
  - **Styling**: clean, minimal Tailwind — card style, readable on dark/light background
  - **Main page** `app/page.tsx`:
    - Server component that fetches pins via `fetch('/api/pins')` (or direct DB call)
    - Renders `<SubmitForm />` (client) and `<MapView pins={pins} />` (dynamic import, ssr:false)
    - Layout: full-height map as background, form overlaid as a top-left panel

  **Must NOT do**:
  - No extra form libraries (no react-hook-form, no Formik)
  - No map theme controls or settings panel

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: React form with async state, autocomplete UX, Tailwind styling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — must complete after Task 8
  - **Parallel Group**: Wave 3 (depends on Task 8 for MapView import)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 2, 4, 6, 8

  **References**:
  - `lib/types.ts` — `Pin`, `GeocodeResult`
  - `components/MapView.tsx` — dynamic import pattern
  - Tailwind docs: `https://tailwindcss.com/docs`

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: City autocomplete shows suggestions
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Click the city input field (selector: input[placeholder*="city" i] or first text input)
      3. Type "Paris"
      4. Wait 400ms (debounce)
      5. Assert: dropdown appears with at least 1 suggestion containing "Paris"
    Expected Result: Suggestions visible below input
    Evidence: .sisyphus/evidence/task-9-autocomplete.png

  Scenario: Full submit flow adds pin to map
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Type "Tokyo" in city input
      3. Wait 400ms, click first suggestion
      4. Type "TestViewer" in username input
      5. Click submit button
      6. Wait for success message: text contains "You've been added"
      7. Assert: success message visible
      8. Wait for page to reload pins (1s)
      9. Assert: .leaflet-marker-icon count has increased by 1
      10. Screenshot
    Expected Result: Pin added and visible on map
    Evidence: .sisyphus/evidence/task-9-submit-success.png

  Scenario: Submit without selecting a suggestion is blocked
    Tool: Playwright
    Steps:
      1. Type "London" in city input but do NOT click a suggestion
      2. Assert: submit button is disabled (attribute "disabled" present)
    Expected Result: Cannot submit without a geocoded selection
    Evidence: .sisyphus/evidence/task-9-submit-disabled.png
  ```

  **Commit**: YES (group with Task 8)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` on the **host** (not inside the Docker runner container — the runner image only contains `.next/standalone` and has no source files). Review all source files for: `as any` / `@ts-ignore`, empty catches, `console.log` in prod paths, commented-out code, unused imports. Check for AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Run `docker compose up -d`. Execute EVERY QA scenario from EVERY task. Test the full submit flow end-to-end in browser. Test error states. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual files. Verify everything in spec was built (no missing) and nothing beyond spec was built (no creep). Flag unaccounted files.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **After Wave 1**: `chore: docker + db schema + project scaffold`
- **After Wave 2**: `feat(api): pins CRUD + geocode proxy + rate limiting`
- **After Wave 3**: `feat(ui): leaflet map + submission form with autocomplete`

---

## Success Criteria

### Verification Commands
```bash
docker compose up -d                          # Expected: containers start cleanly
curl http://localhost:3000/api/pins           # Expected: [] (empty array)
curl -X POST http://localhost:3000/api/pins \
  -H 'Content-Type: application/json' \
  -d '{"city":"Paris, Île-de-France, France","lat":48.8566,"lng":2.3522,"username":"StreamFan42"}' # Expected: 201 + pin JSON
curl http://localhost:3000/api/pins           # Expected: array with Paris pin
curl http://localhost:3000/api/geocode?q=Lon  # Expected: array of city suggestions
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Docker Compose starts cleanly
- [ ] Full viewer submit flow works end-to-end in browser
