# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LTI (Talent Tracking System) is a full-stack ATS (Applicant Tracking System). The backend is an Express + TypeScript API following DDD principles, using Prisma as ORM against PostgreSQL. The frontend is a React app (Create React App) with Bootstrap. E2E tests are written in Cypress and live inside the `frontend/` directory.

- Backend runs on **http://localhost:3010**
- Frontend runs on **http://localhost:3000**
- Database: PostgreSQL via Docker Compose

## Commands

### Infrastructure
```sh
# Start PostgreSQL database (required before running the backend)
docker-compose up -d
docker-compose down
```

### Backend (`cd backend`)
```sh
npm run dev          # Development with hot reload (ts-node-dev)
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled dist/index.js
npm test             # Run Jest unit tests
npm run prisma:generate  # Regenerate Prisma client after schema changes

# Database setup (run once or after schema changes)
npx prisma migrate dev
ts-node prisma/seed.ts
```

### Frontend (`cd frontend`)
```sh
npm start            # Development server at http://localhost:3000
npm run build        # Production build
npm test             # Jest unit tests
```

### Cypress E2E Tests (`cd frontend`)
```sh
npx cypress open     # Interactive test runner (browser UI)
npx cypress run      # Headless run
# Specs must be in cypress/integration/**/*.spec.{js,ts}
# Requires both frontend (port 3000) and backend (port 3010) to be running
```

### Run a single backend test file
```sh
cd backend && npx jest src/application/services/candidateService.test.ts
```

## Architecture

### Backend — DDD Layered Structure

```
backend/src/
├── domain/models/       # Entity classes (Candidate, Position, Application, etc.)
├── application/services/ # Business logic (candidateService, positionService)
│   └── validator.ts     # Input validation
├── presentation/controllers/ # HTTP request handlers
├── routes/              # Express route definitions
└── index.ts             # App entry point — wires middleware, routes, Prisma
```

**Key design decisions:**
- `req.prisma` is injected via middleware in `index.ts` — controllers access the DB through `req.prisma`, not by importing PrismaClient directly.
- Domain model classes (e.g., `Candidate`) wrap raw Prisma data in typed constructors. They contain both business logic and currently some DB interaction (a known tech-debt, documented in `ManifestoBuenasPracticas.md`).
- The project follows DDD: domain → application services → controllers → routes. New features should respect this flow.

**API endpoints:**
- `POST /candidates`, `GET /candidates/:id`, etc. — see `backend/api-spec.yaml`
- `GET /positions`, `GET /positions/:id/candidates`, `GET /positions/:id/interviewflow`
- `POST /upload` — CV file upload via multer

### Frontend — Component Structure

```
frontend/src/
├── components/   # UI components (RecruiterDashboard, Positions, PositionDetails, AddCandidateForm, etc.)
├── services/     # API call helpers (candidateService.js)
└── App.js        # Router setup
```

The frontend uses `react-router-dom` v6 for routing, `react-bootstrap` for UI, and `react-beautiful-dnd` / `react-dnd` for drag-and-drop in the kanban board.

### Cypress Test Structure

```
frontend/cypress/
├── integration/   # Test specs (*.spec.{js,ts}) — add new tests here
├── fixtures/      # Static test data (JSON)
└── support/
    └── e2e.js     # Imports commands.js; add custom Cypress commands here
```

The Cypress config (`frontend/cypress.config.js`) sets `baseUrl: http://localhost:3000` and scans `cypress/integration/**/*.spec.{js,ts}`.

### Data Model

Core entities: `Candidate` → `Application` → `Position` → `InterviewFlow` → `InterviewStep`. Candidates have `Education`, `WorkExperience`, and `Resume` sub-entities. See `backend/prisma/schema.prisma` for the full schema and `backend/ModeloDatos.md` for a diagram.

## Reference Docs

- API specification: `backend/api-spec.yaml`
- Data model diagram: `backend/ModeloDatos.md`
- DDD/SOLID good practices guide: `backend/ManifestoBuenasPracticas.md`
- New route guide: `backend/src/prompts/CreateNewRoute.md`

---

## MCP — PostgreSQL Integration

This project uses the **PostgreSQL MCP server** to allow Claude Code to query the database directly during development and test generation.

**Connection details:** stored in `.env` (never commit credentials). See `.env.example` for the required variables.

**Configured in:** `.claude/settings.json` (not committed — add to `.gitignore`)

**Use cases:**
- Query real position IDs and candidate data before generating Cypress tests
- Verify that drag-and-drop tests correctly updated `currentInterviewStep` in the DB
- Inspect seed data without opening a separate DB client

---

## E2E Testing — Conventions

### Selectors
Always use `data-testid` attributes for Cypress selectors. Never rely on CSS classes, element tags, or text content as primary selectors — they break when UI changes.

```jsx
// Good
<h2 data-testid="position-title">{positionName}</h2>
cy.get('[data-testid="position-title"]')

// Avoid
cy.get('h2')
cy.contains('Senior Full-Stack Engineer')
```

### Test structure
```
frontend/cypress/
├── integration/
│   └── position.spec.js   # E2E tests for PositionDetails page
├── fixtures/              # Static JSON test data
└── support/
    ├── e2e.js             # Entry point — imports commands
    └── commands.js        # Custom Cypress commands (e.g. dragAndDrop)
```

### Key test scenarios (position.spec.js)
1. **Page load** — title renders, all interview stage columns appear, candidate cards are in correct columns
2. **Drag & drop** — candidate moves between columns, `PUT /candidates/:id` is called with correct body

### Drag & drop with react-beautiful-dnd
`react-beautiful-dnd` does not respond to standard Cypress `.drag()`. Use pointer event simulation via a custom `cy.dragAndDrop()` command defined in `cypress/support/commands.js`.

### API interception
Use `cy.intercept()` to stub or spy on backend calls:
```js
cy.intercept('PUT', '/candidates/*').as('updateCandidate')
cy.wait('@updateCandidate').its('request.body').should('include', { currentInterviewStep: 2 })
```

---

## Seed Data Reference

The seed (`backend/prisma/seed.ts`) creates the following data used in E2E tests:

| Entity | Name | Notes |
|--------|------|-------|
| Position | Senior Full-Stack Engineer | ID: 1 (first position created) |
| Position | Data Scientist | ID: 2 |
| Stage | Initial Screening | Step 1 of flow 1 |
| Stage | Technical Interview | Step 2 of flow 1 |
| Stage | Manager Interview | Step 3 of flow 1 |
| Candidate | Carlos García | In **Initial Screening** |
| Candidate | John Doe | In **Technical Interview** |
| Candidate | Jane Smith | In **Technical Interview** |

> Use the PostgreSQL MCP to verify actual IDs at runtime if the DB has been re-seeded.

---

## Claude Code Custom Tools

### Commands
Located in `.claude/commands/`:

| Command | File | Purpose |
|---------|------|---------|
| `/generate-test` | `generate-test.md` | Generate a Cypress E2E test for a given React component |

### Agents
Located in `.claude/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| `qa-agent` | `qa-agent.md` | Specialized QA agent with full project context for test generation and review |

---

## Development Workflow for E2E Tests

```
1. Start infrastructure:
   docker-compose up -d
   cd backend && npm start
   cd frontend && npm start

2. (Optional) Query DB via MCP to verify seed data

3. Add data-testid attributes to React components as needed

4. Generate or write test in cypress/integration/

5. Run tests:
   cd frontend && npx cypress open

6. Verify DB state via MCP after drag-and-drop tests

7. Document prompts used in frontend/prompts/prompts-iniciales.md
```
