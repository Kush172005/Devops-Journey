# Viva Preparation — Full Explanation (Architecture, Workflow, Design Decisions, Challenges)

Use this document to answer evaluator questions on your DevOps project. It covers all 11 tasks and the four expected areas: **Architecture**, **Workflow**, **Design decisions**, and **Challenges**.

---

## 1. Project Overview

- **What it is:** ShopHub — a full-stack e-commerce web app (product listing, cart, INR pricing) with real product images.
- **Stack:** React 19 + Vite 7 + Tailwind CSS (frontend), Node.js + Express 5 (backend), GitHub Actions (CI/CD), optional deployment to GitHub Pages, Vercel, and AWS EC2.
- **Repo structure:** Monorepo with `client/` (frontend), `server/` (backend), `.github/workflows/` (CI/CD), and config files at root.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     USER / BROWSER                        │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
┌─────────────────┐                   ┌─────────────────────┐                 ┌─────────────────────┐
│  GitHub Pages   │                   │   Vercel (Backend)   │                 │   EC2 (Full stack)  │
│  (Static React  │  ─── API calls ──►│   Express serverless  │                 │   Node + React       │
│   build only)   │                   │   /api/*, /health     │                 │   one origin :3000   │
└─────────────────┘                   └─────────────────────┘                 └─────────────────────┘
         │                                        │                                        │
         │                                        │                                        │
         └────────────────────────────────────────┼────────────────────────────────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │   GitHub Actions (CI/CD)  │
                                    │   Build, Test, Lint,      │
                                    │   Deploy to Pages / EC2   │
                                    └──────────────────────────┘
```

- **Frontend:** SPA (Single Page Application). React app talks to the backend API (base URL from env: `VITE_API_URL`).
- **Backend:** REST API. Express serves `/health`, `/api/products`, `/api/products/:id`, `/api/cart` (GET/POST/PUT/DELETE). In-memory store for products and cart (no DB in this project).
- **Deployment options:**
  - **Option A:** Frontend on GitHub Pages, backend on Vercel (separate origins; frontend needs `VITE_API_URL`).
  - **Option B:** Full app on one EC2 instance — Node serves both API and static React build from the same origin (no CORS issues).

### 2.2 Frontend Architecture

- **client/** — Vite + React 19, ES modules.
- **Entry:** `index.html` → `main.jsx` → `App.jsx`. **Utils:** `client/src/utils/formatInr.js` (INR formatting), tested with Vitest in `formatInr.test.js`.
- **State:** React `useState` (products, cart, loading, showCart, selectedProduct). No global state library.
- **API:** Axios; base URL from `import.meta.env.VITE_API_URL` (build-time env for production).
- **Styling:** Tailwind CSS; design tokens in `index.css` (e.g. base path for GitHub Pages via `VITE_BASE_PATH`). **Formatting:** Prettier (`.prettierrc`); CI runs `format:check`.
- **Build output:** `client/dist/` — static files (HTML, JS, CSS) ready for any static host or for EC2 to serve.

### 2.3 Backend Architecture

- **server/server.js** — Express app: CORS, `express.json()`, product and cart routes, `/health`, optional static serving of `client/dist` when `NODE_ENV=production` and path exists (for EC2).
- **Conditional listen:** `if (require.main === module)` so the same file can be required in tests without starting the HTTP server.
- **server/test/** — Unit and integration tests: Node’s built-in `node:test`, `node:assert`, and `supertest`. Includes an “Integration: API flow” test (get products → add to cart → get cart).
- **server/api/index.js** — Vercel serverless entry; exports the Express app so Vercel can run it per request.
- **server/vercel.json** — Vercel config: all routes go to `api/index.js`.

### 2.4 Data Flow

- **Products:** Hardcoded in `server.js` (id, name, description, price in INR, imageUrl). GET `/api/products` and `/api/products/:id` read from this.
- **Cart:** In-memory array in `server.js`; cart items have id, productId, name, price, quantity. POST adds, PUT updates quantity, DELETE removes. Cart does not persist across server restarts (by design for this demo).

---

## 3. Task-by-Task Summary (All 11)

| # | Task | What You Implemented | Where |
|---|------|----------------------|-------|
| 1 | **Commit regularity** | Meaningful commits over time (not last-day bulk); logical changes per commit. | Git history |
| 2 | **GitHub Workflows / CI** | Pipelines on push/PR: install deps, **run tests** (frontend + backend), **format check** (Prettier), build (frontend), run linter (ESLint). | `frontend.yml`, `backend.yml` |
| 3 | **Frontend** | Clean UI (React, Tailwind), functional components, API integration (products + cart), responsive layout, INR, real images. | `client/` |
| 4 | **Unit testing** | **Frontend:** Vitest tests for `formatInr` (client/src/utils/formatInr.test.js). **Backend:** Node `node:test` + supertest for health, products, cart. | `client/src/utils/`, `server/test/api.test.js` |
| 5 | **Integration testing** | Backend: “Integration: API flow” test — get products → add to cart → get cart and verify item (validates interaction between routes and in-memory store). | `server/test/api.test.js` |
| 6 | **E2E (bonus)** | Not implemented (no Cypress/Playwright). | — |
| 7 | **PR checks (lint)** | ESLint **and** Prettier: frontend workflow runs `npm run format:check` and `npm run lint`; job fails if either fails. | `frontend.yml`, `client/eslint.config.js`, `client/.prettierrc` |
| 8 | **Dependabot** | Weekly npm updates for `client` and `server`; limits open PRs. | `.github/dependabot.yml` |
| 9 | **EC2 + GitHub** | Two flows: (1) Full app deploy to EC2: build client, SCP server + dist, SSH and `npm ci`, pm2 restart. (2) Static HTML/images to Nginx on push to `demo`. | `deploy-app-ec2.yml`, `deploy to EC2.yml` |
| 10 | **Idempotent scripts** | Use `mkdir -p` in workflows; deploy steps written so re-running produces same result. | All workflow `run` steps |
| 11 | **Explanation** | This document: architecture, workflow, design decisions, challenges. | This file |

---

## 4. Workflows (GitHub Actions) — Detail

### 4.1 Frontend CI (`frontend.yml`)

- **Trigger:** Push or PR to `main`/`master` when files under `client/**` change.
- **Job:** Checkout → Setup Node 20 (with npm cache) → `npm ci` → **`npm test`** (Vitest) → **`npm run format:check`** (Prettier) → `npm run build` → `npm run lint` (ESLint).
- **Purpose:** Ensure frontend installs, tests pass, code is formatted, builds, and passes ESLint. PR fails if any step fails.

### 4.2 Backend CI (`backend.yml`)

- **Trigger:** Push or PR to `main`/`master` when files under `server/**` change.
- **Job:** Checkout → Setup Node 20 (with npm cache) → `npm ci` in server → `npm test`.
- **Purpose:** Run unit/API tests; no manual server start — tests use the exported app with supertest.

### 4.3 Deploy to GitHub Pages (`deploy-pages.yml`)

- **Trigger:** Push to `main`/`master` when `client/**` or this workflow changes, or manual dispatch.
- **Permissions:** `contents: write` (to push to `gh-pages`).
- **Job:** Checkout → Node 20 → build client with `VITE_API_URL` and `VITE_BASE_PATH=/${{ github.event.repository.name }}/` → push `client/dist` to `gh-pages` using `peaceiris/actions-gh-pages` with `force_orphan: true`.
- **Purpose:** Serve only the built app from `gh-pages`; no README or other repo files. Pages must be set to “Deploy from a branch” → branch `gh-pages`, folder `/`.

### 4.4 Deploy App to EC2 (`deploy-app-ec2.yml`)

- **Trigger:** Push to `main`/`master` when `client/**`, `server/**`, or this workflow changes, or manual dispatch.
- **Secrets:** `EC2_SSH_KEY` (PEM content), `EC2_HOST`; optional: `EC2_APP_URL`, `EC2_APP_PATH`.
- **Job:** Checkout → build client (with `EC2_APP_URL` if set) → setup SSH key and known_hosts → create remote dirs → SCP `server/*` and `client/dist` to EC2 → SSH: `npm ci --omit=dev` in server dir, then `pm2 restart shophub` or `pm2 start server.js --name shophub`, `pm2 save`.
- **Purpose:** Full automated deployment; one URL on EC2 serves both API and React (Node serves static in production when `client/dist` exists).

### 4.5 Deploy Images.html to EC2 (`deploy to EC2.yml`)

- **Trigger:** Push to branch `demo` or manual dispatch.
- **Job:** Checkout → setup SSH → SCP `Images.html` and `images/` to EC2 `/tmp` → SSH: move to `/var/www/html`, fix ownership/permissions, `systemctl restart nginx`.
- **Purpose:** Deploy static HTML + images to Nginx (separate from the main app).

### 4.6 Recap (`recap.yml`)

- **Trigger:** Manual only (`workflow_dispatch`) with inputs (name, age, city).
- **Purpose:** Demo workflow with inputs and optional steps (e.g. Hello World, weather); not part of production CI.

---

## 5. Design Decisions

### 5.1 Why Monorepo (client + server in one repo)?

- Single place for code and CI; one clone for local dev; workflows can trigger on `client/**` or `server/**` separately. Aligns with “one app, one repo” for this assignment.

### 5.2 Why React + Vite?

- React: component-based UI, good for cart and product list; Vite: fast dev server and builds, native ESM, minimal config. Tailwind for rapid, consistent styling without separate CSS architecture.

### 5.3 Why Express and in-memory data?

- Express: simple REST API, easy to test with supertest. In-memory: no DB setup for the assignment; focus on CI/CD and deployment. Can be swapped for a DB later without changing the API contract.

### 5.4 Why INR and real images?

- INR: target audience (India); formatting via `Intl.NumberFormat('en-IN', { currency: 'INR' })`. Real images (Unsplash URLs): production-like look instead of placeholders/emojis.

### 5.5 Why Node built-in test + supertest (backend), Vitest (frontend)?

- **Backend:** `node --test` is built in; supertest is the standard for testing Express. **Frontend:** Vitest fits Vite and runs fast; we test pure functions (e.g. `formatInr`) in `client/src/utils/`.

### 5.6 Why ESLint and Prettier?

- ESLint catches bugs and enforces React rules; Prettier enforces consistent formatting. CI runs `format:check` and `lint`; PR fails if code is badly formatted or has lint errors.

### 5.7 Why Dependabot for both client and server?

- Security and freshness; weekly schedule and PR limit avoid noise while keeping dependencies updated.

### 5.8 Why two deployment options (Pages+Vercel vs EC2)?

- **Pages + Vercel:** Free, minimal ops; frontend and backend can scale independently; good for demos and portfolios.
- **EC2:** Full control, single origin (no CORS), demonstrates SSH, SCP, and service restart from GitHub Actions.

### 5.9 Why `force_orphan` for gh-pages?

- Ensures `gh-pages` contains only the built app (e.g. `client/dist`). Without it, merge or history can leave README or other files, so Pages might show the repo instead of the app.

### 5.10 Why conditional listen in server.js?

- `if (require.main === module)` allows requiring the app in tests without starting the server. Same file used for local run, tests, and Vercel (Vercel uses `api/index.js` which requires the app).

### 5.11 Why serve static from Express on EC2?

- One port (3000), one origin; no Nginx config for the SPA; simpler deployment. Implemented only when `NODE_ENV=production` and `client/dist` exists.

---

## 6. Challenges and Solutions

### 6.1 GitHub Pages showed README instead of the app

- **Cause:** Pages was serving the default branch (e.g. main) or `gh-pages` had merged in repo files.
- **Solution:** Set Pages to “Deploy from a branch” → branch `gh-pages`, folder `/`. Use `force_orphan: true` in the deploy workflow so `gh-pages` is replaced entirely by the contents of `client/dist`.

### 6.2 First deploy-pages run failed with 404

- **Cause:** Using `actions/deploy-pages` (Pages deployment API) before Pages was enabled for “GitHub Actions” source, or repo/org restrictions.
- **Solution:** Switched to `peaceiris/actions-gh-pages` and “Deploy from a branch” so we only push to `gh-pages`; no dependency on the deployment API.

### 6.3 ESLint errors in React (useEffect / setState)

- **Cause:** React hooks rules: functions used in `useEffect` must be declared before the effect, and setState usage in effects was flagged.
- **Solution:** Moved data-fetch logic inside the effect (async `load()` with `Promise.all`), added a `cancelled` flag for cleanup, removed the unused fetch function. Lint passes and CI fails if new violations are introduced.

### 6.4 Backend “test” was just starting the server

- **Cause:** Original `npm test` only ran `node server.js`, not a test suite.
- **Solution:** Refactored server to export the app and not listen when required; added `server/test/api.test.js` with supertest and `node --test`; updated `backend.yml` to run `npm test` (real tests).

### 6.5 CORS and multiple origins

- **Cause:** Frontend on Pages and backend on Vercel (or EC2) are different origins.
- **Solution:** Backend uses `cors()` (allow all origins for this project). For EC2-only deployment, same origin avoids CORS.

### 6.6 Base path on GitHub Pages

- **Cause:** Project Pages URL is `username.github.io/repo-name/`; assets must load from that subpath.
- **Solution:** Build with `VITE_BASE_PATH=/${{ github.event.repository.name }}/` in the deploy workflow; `vite.config.js` uses `base: process.env.VITE_BASE_PATH || '/'`.

### 6.7 Idempotency in workflows

- **Challenge:** Scripts should be safe to run multiple times.
- **Solution:** Use `mkdir -p`; deploy steps overwrite/copy fresh files; pm2 “restart or start” pattern (`pm2 restart shophub 2>/dev/null || pm2 start ...`).

---

## 7. Quick Q&A for Viva

**Q: Describe the architecture in one minute.**  
A: Full-stack monorepo: React (Vite + Tailwind) in `client/`, Express API in `server/`. Frontend calls backend via env-configured URL. We can deploy frontend to GitHub Pages and backend to Vercel, or run both on one EC2 instance where Node serves API and static build. CI runs on push/PR: frontend build + lint, backend tests; separate workflows deploy to Pages or EC2.

**Q: What triggers the frontend CI?**  
A: Push or pull request to main/master when files under `client/**` change. It runs install, build, and lint; the job fails if any step fails, including lint.

**Q: How do you test the backend?**  
A: Unit/API tests in `server/test/api.test.js` using Node’s `node:test`, `assert`, and supertest. We require the Express app (no server listen) and hit `/health`, `/api/products`, `/api/products/:id`, and `/api/cart` (validation and create). Run with `npm test`; CI runs this in `backend.yml`.

**Q: Why does the server not call `app.listen()` in tests?**  
A: So we can require the app in tests without starting the HTTP server. We use `if (require.main === module)` to call `app.listen()` only when the file is run directly (e.g. `node server.js`).

**Q: What is Dependabot doing?**  
A: It’s configured in `.github/dependabot.yml` to open PRs for npm dependency updates in `client` and `server` on a weekly schedule, with a limit on open PRs per directory.

**Q: How does deployment to EC2 work?**  
A: The `deploy-app-ec2.yml` workflow builds the client, then uses SSH (with `EC2_SSH_KEY`) and SCP to copy `server/` and `client/dist` to EC2. It runs `npm ci --omit=dev` in the server directory and then `pm2 restart shophub` (or first-time `pm2 start`). The app is served from one origin on EC2.

**Q: What secrets are needed for EC2 deploy?**  
A: Required: `EC2_SSH_KEY` (full PEM content), `EC2_HOST` (IP or hostname). Optional: `EC2_APP_URL` (so the built frontend knows the API URL), `EC2_APP_PATH` (default `/home/ubuntu/app`).

**Q: How does the frontend know the API URL in production?**  
A: At build time via `VITE_API_URL` (e.g. in GitHub Secrets for Pages deploy, or in EC2_APP_URL for EC2). The client uses `import.meta.env.VITE_API_URL || 'http://localhost:3000'`.

**Q: What is idempotency and where did you use it?**  
A: Running the same script again should yield the same result. We use `mkdir -p` in workflows so directories are created without failing if they exist; deploy steps overwrite files; pm2 restart is idempotent.

**Q: What was the hardest challenge?**  
A: GitHub Pages showing the README instead of the app. Fix was to use “Deploy from a branch” with `gh-pages` and `force_orphan: true` so the branch contains only the built app.

**Q: Where is the health check and why?**  
A: `GET /health` in `server.js` returns `{ "status": "ok" }`. Used for load balancers, monitoring, and CI; documented in README and tested in `api.test.js`.

**Q: Why Vercel for the backend?**  
A: Serverless, free tier, no server to manage; we export the Express app from `server/api/index.js` and route all traffic to it via `vercel.json`.

---

## 8. Demo Checklist (If You Need to Show Something Live)

- [ ] **Local:** `cd server && npm start`; `cd client && npm run dev` — app on :5173, API on :3000.
- [ ] **Tests:** `cd server && npm test` — all tests pass.
- [ ] **Lint:** `cd client && npm run lint` — no errors.
- [ ] **GitHub:** Open Actions tab — show frontend and backend workflows (and optionally deploy-pages / deploy-app-ec2).
- [ ] **Pages:** Open `https://<username>.github.io/<repo>/` — show the ShopHub UI.
- [ ] **Health:** If backend is deployed, open `https://<backend-url>/health` — show `{"status":"ok"}`.
- [ ] **Dependabot:** Settings → Code security and analysis — show Dependabot enabled; optionally show an open/closed Dependabot PR.
- [ ] **EC2 (if applicable):** Show deploy workflow run and explain: build → SCP → SSH → npm ci → pm2 restart.

---

## 9. File Reference (Where to Point During Viva)

| What | Where |
|------|--------|
| Frontend app | `client/src/App.jsx`, `client/index.html`, `client/src/index.css` |
| Frontend utils + unit tests | `client/src/utils/formatInr.js`, `client/src/utils/formatInr.test.js` |
| Prettier | `client/.prettierrc`, `client/.prettierignore`; scripts: `format`, `format:check` |
| Backend API | `server/server.js` |
| API + integration tests | `server/test/api.test.js` |
| Frontend CI | `.github/workflows/frontend.yml` |
| Backend CI | `.github/workflows/backend.yml` |
| Pages deploy | `.github/workflows/deploy-pages.yml` |
| EC2 app deploy | `.github/workflows/deploy-app-ec2.yml` |
| Dependabot | `.github/dependabot.yml` |
| Vercel backend | `server/vercel.json`, `server/api/index.js` |
| Env examples | `client/.env.example`, `server/.env.example` |
| Docs | `README.md` (quick start, API, deployment), this file |

---

## 10. Changes Made to Meet All Requirements

- **Unit testing (frontend):** Added Vitest; extracted `formatInr` to `client/src/utils/formatInr.js`; added `formatInr.test.js` (3 tests). Frontend CI now runs `npm test`.
- **Unit testing (backend):** Already present (node:test + supertest in `server/test/api.test.js`).
- **Integration testing:** Added “Integration: API flow” test in `server/test/api.test.js`: get products → POST to cart → GET cart and verify the added item (validates interaction between modules).
- **PR checks (Prettier):** Added Prettier to client (`.prettierrc`, `.prettierignore`), scripts `format` and `format:check`. Frontend workflow runs `npm run format:check` before build and lint; job fails if formatting is wrong.
- **CI “Run tests”:** Frontend workflow now includes “Run tests” (Vitest) and “Run format check” (Prettier) so the pipeline has install deps, run tests, run linter, and format check as required.
- **ESLint:** Added Node globals for `vite.config.js` in `eslint.config.js` so `process.env` does not trigger no-undef.

Good luck for your viva.
