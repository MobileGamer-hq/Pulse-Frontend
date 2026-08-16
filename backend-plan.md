# Pulse — Backend Build Plan

**Status:** Draft v1
**Scope:** Phased roadmap + database schema, derived from the Backend Requirements Specification and the product design document
**Stack:** Not yet decided — this plan is written to be stack-agnostic (works whether you land on Node/NestJS/PostgreSQL/Prisma or Spring Boot/MySQL/JPA). Stack-specific notes are called out separately in Section 6.

---

## 1. Guiding Principles

Before writing any code, these constraints should shape every phase:

1. **Multi-tenant from day one.** Every table that isn't purely global carries `org_id`, and every query is scoped by it — even though only one organization exists at launch. Retrofitting tenancy later is far more expensive than building it in now.
2. **RBAC is enforced server-side, never trusted from the client.** The frontend's 7-role system (Admin, Executive, HR, Manager, TeamLead, Member, Contractor) must be re-validated on every API call, not just hidden in the UI.
3. **Connectivity is a backend concern too.** The "click a project → see people → click a person → see their projects" experience requires the API to answer relationship queries in both directions efficiently (see Section 5, Relationship & Graph Layer) — this isn't just a frontend trick.
4. **Additive schema growth.** Model the 11 entities from the spec close to 1:1 at first; avoid premature normalization or abstraction that isn't justified yet (e.g. don't build a generic "entity" supertable — keep Task, Project, Goal etc. as real tables with real columns for now).
5. **Background work is separated from request/response.** Report generation, PDF export, webhook dispatch, and relationship-graph computation should run as async jobs, not inline in an API handler.

---

## 2. Domain Model Summary

Core entities (from the spec), grouped by concern:

| Group | Entities |
|---|---|
| Identity & Org | Organization, User, Team |
| Work | Project, Task, Subtask, Comment |
| Tagging | Tag |
| Daily Pulse | EODEntry |
| Goals | Goal, KeyResult |
| Reporting | Report |
| System | ActivityLog, SavedView, Webhook, ApiKey, AuditLog |

Relationships that matter most for the "connected" product feel:
- User ↔ Team (many-to-one, plus TeamLead as a distinguished member)
- User ↔ Project (many-to-many via membership)
- User ↔ Task (many-to-many via assignment)
- Task ↔ Project (many-to-one)
- Task ↔ Goal (many-to-one, optional)
- Task ↔ Task (self-referential, dependencies)
- Tag ↔ {Task, Project, User, Goal} (polymorphic many-to-many)
- Goal ↔ KeyResult (one-to-many)
- Goal ↔ Task (many-to-many via KeyResult.linkedTaskIds and Goal.linkedTaskIds)

---

## 3. Database Schema

Written as conceptual SQL DDL — directly usable for PostgreSQL with minor tweaks, and translatable 1:1 to JPA `@Entity` classes / MySQL types if that stack is chosen instead (notes on translation in Section 6).

```sql
-- ============ ORG & IDENTITY ============

CREATE TABLE organizations (
  id            UUID PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  domain        VARCHAR(255),
  logo_url      TEXT,
  billing_tier  VARCHAR(50) DEFAULT 'trial',
  seats_purchased INT DEFAULT 5,
  renews_at     TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now()
);

CREATE TABLE teams (
  id        UUID PRIMARY KEY,
  org_id    UUID NOT NULL REFERENCES organizations(id),
  name      VARCHAR(255) NOT NULL,
  lead_id   UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id                    UUID PRIMARY KEY,
  org_id                UUID NOT NULL REFERENCES organizations(id),
  team_id               UUID REFERENCES teams(id),
  name                  VARCHAR(255) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  password_hash         TEXT,               -- null if OAuth-only
  role                  VARCHAR(20) NOT NULL CHECK (role IN
                          ('Admin','Executive','HR','Manager','TeamLead','Member','Contractor')),
  title                 VARCHAR(255),
  avatar_url            TEXT,
  is_contractor         BOOLEAN DEFAULT false,
  capacity_hours_per_week INT DEFAULT 40,
  created_at            TIMESTAMP DEFAULT now(),
  UNIQUE (org_id, email)
);

-- ============ TAGS (polymorphic, admin-governed) ============

CREATE TABLE tags (
  id            UUID PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES organizations(id),
  name          VARCHAR(100) NOT NULL,
  color_hex     VARCHAR(7) NOT NULL,
  bg_hex        VARCHAR(30),
  text_hex      VARCHAR(7),
  description   TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT now(),
  UNIQUE (org_id, name)
);

-- tags apply to multiple entity types; junction tables per entity keep FKs real (see Principle 4)
CREATE TABLE task_tags    (task_id UUID REFERENCES tasks(id),    tag_id UUID REFERENCES tags(id), PRIMARY KEY (task_id, tag_id));
CREATE TABLE project_tags (project_id UUID REFERENCES projects(id), tag_id UUID REFERENCES tags(id), PRIMARY KEY (project_id, tag_id));
CREATE TABLE user_tags    (user_id UUID REFERENCES users(id),    tag_id UUID REFERENCES tags(id), PRIMARY KEY (user_id, tag_id));
CREATE TABLE goal_tags    (goal_id UUID REFERENCES goals(id),    tag_id UUID REFERENCES tags(id), PRIMARY KEY (goal_id, tag_id));

-- ============ PROJECTS ============

CREATE TABLE projects (
  id              UUID PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  template_type   VARCHAR(50) CHECK (template_type IN
                    ('SoftwareSprint','BugTracking','MarketingCampaign','ClientOnboarding','GeneralOps')),
  team_id         UUID REFERENCES teams(id),
  lead_id         UUID REFERENCES users(id),
  start_date      DATE,
  target_end_date DATE,
  status          VARCHAR(20) DEFAULT 'Planning' CHECK (status IN ('Active','Planning','Completed','OnHold')),
  created_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id),
  user_id    UUID REFERENCES users(id),
  PRIMARY KEY (project_id, user_id)
);

-- ============ TASKS ============

CREATE TABLE tasks (
  id                UUID PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES organizations(id),
  project_id        UUID NOT NULL REFERENCES projects(id),
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  status            VARCHAR(20) DEFAULT 'Todo' CHECK (status IN ('Todo','InProgress','AtRisk','Blocked','Done')),
  priority          VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Urgent','High','Medium','Low')),
  estimated_hours   DECIMAL(6,2),
  actual_hours      DECIMAL(6,2) DEFAULT 0,
  due_date          DATE,
  start_date        DATE,
  linked_goal_id    UUID REFERENCES goals(id),
  blocked_reason    TEXT,
  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE task_dependencies (
  task_id            UUID REFERENCES tasks(id),
  depends_on_task_id UUID REFERENCES tasks(id),
  PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE subtasks (
  id       UUID PRIMARY KEY,
  task_id  UUID NOT NULL REFERENCES tasks(id),
  title    VARCHAR(255) NOT NULL,
  done     BOOLEAN DEFAULT false,
  position INT DEFAULT 0
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY,
  task_id    UUID NOT NULL REFERENCES tasks(id),
  author_id  UUID NOT NULL REFERENCES users(id),
  text       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ============ DAILY PULSE (EOD) ============

CREATE TABLE eod_entries (
  id                 UUID PRIMARY KEY,
  org_id             UUID NOT NULL REFERENCES organizations(id),
  user_id            UUID NOT NULL REFERENCES users(id),
  team_id            UUID REFERENCES teams(id),
  entry_date         DATE NOT NULL,
  accomplishments    TEXT[],            -- or a child table if the stack lacks array types (see Sec. 6)
  blockers           TEXT,
  blocked_task_id    UUID REFERENCES tasks(id),
  energy_index       SMALLINT CHECK (energy_index BETWEEN 1 AND 5),
  flagged_to_manager BOOLEAN DEFAULT false,
  created_at         TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE TABLE eod_completed_tasks (
  eod_id  UUID REFERENCES eod_entries(id),
  task_id UUID REFERENCES tasks(id),
  PRIMARY KEY (eod_id, task_id)
);

-- ============ GOALS / OKRs ============

CREATE TABLE goals (
  id           UUID PRIMARY KEY,
  org_id       UUID NOT NULL REFERENCES organizations(id),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  owner_type   VARCHAR(20) CHECK (owner_type IN ('org','team','individual')),
  owner_id     UUID,              -- polymorphic: org_id, team_id, or user_id depending on owner_type
  target_date  DATE,
  status       VARCHAR(20) DEFAULT 'OnTrack' CHECK (status IN ('OnTrack','AtRisk','Behind','Achieved')),
  created_at   TIMESTAMP DEFAULT now()
);

CREATE TABLE key_results (
  id             UUID PRIMARY KEY,
  goal_id        UUID NOT NULL REFERENCES goals(id),
  title          VARCHAR(255) NOT NULL,
  target_value   DECIMAL(12,2) NOT NULL,
  current_value  DECIMAL(12,2) DEFAULT 0,
  unit           VARCHAR(50)
);

CREATE TABLE key_result_tasks (
  key_result_id UUID REFERENCES key_results(id),
  task_id       UUID REFERENCES tasks(id),
  PRIMARY KEY (key_result_id, task_id)
);

CREATE TABLE goal_tasks (
  goal_id UUID REFERENCES goals(id),
  task_id UUID REFERENCES tasks(id),
  PRIMARY KEY (goal_id, task_id)
);

-- ============ REPORTS ============

CREATE TABLE reports (
  id                    UUID PRIMARY KEY,
  org_id                UUID NOT NULL REFERENCES organizations(id),
  type                  VARCHAR(10) CHECK (type IN ('weekly','monthly')),
  title                 VARCHAR(255),
  period_label          VARCHAR(100),
  tasks_completed       INT,
  tasks_planned         INT,
  avg_sentiment         DECIMAL(3,2),
  blockers_raised       INT,
  blockers_resolved     INT,
  okr_milestones_reached INT,
  executive_summary     TEXT,
  key_risks             TEXT[],
  created_at            TIMESTAMP DEFAULT now()
);

CREATE TABLE report_team_highlights (
  id         UUID PRIMARY KEY,
  report_id  UUID NOT NULL REFERENCES reports(id),
  team_id    UUID REFERENCES teams(id),
  highlight  TEXT
);

-- ============ ACTIVITY LOG (drives connectivity feed) ============

CREATE TABLE activity_log (
  id            UUID PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES organizations(id),
  actor_id      UUID NOT NULL REFERENCES users(id),
  action        VARCHAR(255) NOT NULL,
  target_type   VARCHAR(20) CHECK (target_type IN ('person','project','task','goal','tag','team')),
  target_id     UUID NOT NULL,
  parent_type   VARCHAR(20),
  parent_id     UUID,
  timestamp     TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_activity_org_time ON activity_log(org_id, timestamp DESC);

-- ============ SAVED VIEWS ============

CREATE TABLE saved_views (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  name       VARCHAR(255) NOT NULL,
  is_pinned  BOOLEAN DEFAULT false,
  filters    JSONB NOT NULL,     -- MySQL: JSON type
  created_at TIMESTAMP DEFAULT now()
);

-- ============ ADMIN / SYSTEM ============

CREATE TABLE webhooks (
  id         UUID PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id),
  url        TEXT NOT NULL,
  events     TEXT[],            -- e.g. ['task.created','eod.flagged']
  secret     TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE api_keys (
  id          UUID PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id),
  name        VARCHAR(255),
  key_prefix  VARCHAR(20),
  key_hash    TEXT NOT NULL,     -- never store the raw key
  created_at  TIMESTAMP DEFAULT now(),
  last_used   TIMESTAMP
);

CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id),
  actor_id   UUID REFERENCES users(id),
  action     VARCHAR(255) NOT NULL,
  detail     JSONB,
  timestamp  TIMESTAMP DEFAULT now()
);
```

**Indexing priorities** (beyond primary/foreign keys): `tasks(org_id, project_id, status)`, `tasks(org_id, due_date)`, `eod_entries(org_id, entry_date)`, `activity_log(org_id, timestamp)` — these back the highest-traffic queries (task board filtering, EOD feeds, activity feed).

---

## 4. RBAC Enforcement Model

Implement as a single authorization layer used by every endpoint, not scattered per-controller checks:

1. **AuthN middleware** resolves the JWT/session → `{ userId, orgId, role, teamId }`.
2. **Scope resolver** determines what data the role can see:
   - `Admin`, `Executive`, `HR` → org-wide (read patterns differ: HR sees people/health data, Executive sees briefs/OKRs, Admin sees everything including billing/webhooks).
   - `Manager` → their team + team's projects.
   - `TeamLead` → their team + explicitly assigned projects.
   - `Member` → their team + assigned projects (read), own records (write).
   - `Contractor` → only explicitly assigned tasks/projects — the narrowest scope.
3. **Policy functions per resource** (e.g. `canEditTask(user, task)`, `canViewEOD(user, targetUser)`) — small, testable, colocated with the resource module rather than one giant switch statement.
4. Every list/query endpoint applies the scope resolver as a `WHERE` filter at the database layer — never filter after fetching everything.

---

## 5. Relationship & Graph Layer

This backs the "connectivity" feature set (Person → Projects → People → ... and the Relationship Map):

- **Bidirectional lookups**: for any entity, expose a "related" endpoint that returns everything linked to it, in both directions (e.g. `GET /projects/:id` includes `members`, `tasks`, `linkedGoals`; a symmetric `GET /users/:id` includes `projects`, `tasks`, `teams`, `goals`).
- **Graph endpoint** (`GET /projects/:id/relationship-graph`): computed on read (not stored) by joining project → members → tasks → goals and shaping into `{ nodes, edges }`. Cache per-project for a short TTL since org structure doesn't change every second.
- Keep this logic in a dedicated service module (e.g. `RelationshipService`) so both the plain "related entities" panels and the graph view reuse the same underlying queries instead of duplicating logic.

---

## 6. Stack Decision Notes (for when you choose)

| Concern | Node/NestJS + PostgreSQL + Prisma | Spring Boot + MySQL + JPA/Hibernate |
|---|---|---|
| Array columns (`TEXT[]`) | Native Postgres support | MySQL has no array type — use a child table (e.g. `eod_accomplishments(eod_id, text)`) instead |
| JSON columns | `JSONB` native | MySQL `JSON` type, less indexable |
| Schema migrations | Prisma Migrate | Flyway or Liquibase alongside JPA |
| Given your current learning path (MySQL, Docker, Spring Boot, JPA/Hibernate), Spring Boot is the faster ramp; NestJS matches the design doc's original recommendation and pairs naturally with the Next.js frontend (shared TypeScript types) |

Recommendation when you're ready to decide: if frontend/backend type-sharing and fastest iteration matter more → NestJS. If you want this project to reinforce what you're actively studying → Spring Boot. Either maps cleanly onto the schema above with the array/JSON adjustments noted.

---

## 7. Phased Build Roadmap

### Phase 0 — Foundations (pre-work)
- Repo setup, CI pipeline, environment config, chosen ORM/migration tool wired up
- `organizations`, `users`, `teams` tables migrated
- Auth: login, session/JWT issuance, `GET /auth/me`
- RBAC middleware + scope resolver skeleton (Section 4), even before most resources exist
- **Exit criteria:** can register an org, log in, and get a role-scoped `/auth/me` response

### Phase 1 — Core Work Engine (MVP backbone)
- `projects`, `tasks`, `subtasks`, `comments`, `task_assignees`, `task_dependencies`
- Full Task CRUD + subtask/comment endpoints (Section 4.2 of the spec)
- Project CRUD + membership
- Activity log writes triggered on task/project mutations
- **Exit criteria:** Kanban/List views in the frontend can fully replace mock task data

### Phase 2 — Tags & Filtering
- `tags` + polymorphic junction tables
- Tag CRUD (admin-only) + `GET /tags/:id/usage`
- Task/project list endpoints extended with full filter query params (search, tags, status, assignee, priority, project, blocker flag, date range)
- `saved_views` CRUD
- **Exit criteria:** filter bar and saved/pinned views work end-to-end

### Phase 3 — Daily Pulse (EOD)
- `eod_entries`, `eod_completed_tasks`
- Submit/fetch EOD endpoints, pre-fill accomplishments from tasks completed that day
- Blocker flag → triggers manager notification (simple in-app notification first; webhook/email later)
- `GET /pulse/summary` for the manager feed aggregation
- **Exit criteria:** EOD check-in flow and manager feed are fully live

### Phase 4 — Connectivity & Relationship Layer
- Bidirectional "related entities" endpoints for Person, Project, Task, Goal, Tag (Section 5)
- `GET /projects/:id/relationship-graph`
- Global search endpoint (`GET /search?q=`) across people/projects/tasks/goals/tags
- **Exit criteria:** clicking through Project → People → Person → Projects works against real data; Relationship Map renders from live data

### Phase 5 — Goals & OKRs
- `goals`, `key_results`, `goal_tasks`, `key_result_tasks`
- Goal/KR CRUD, and the progress-rollup calculation (KR completion % from linked task completion)
- **Exit criteria:** Goals screen shows live rollups reacting to task status changes

### Phase 6 — Analytics & Reports
- Individual dossier aggregation (`GET /analytics/dossier/:userId`)
- Team health aggregation (`GET /analytics/team-health`)
- `reports` table + `POST /reports/generate` (start with rule-based/templated summaries; layer in AI-generated prose later as an enhancement, not a blocker)
- PDF export as an async job (`POST /reports/:id/export-pdf`)
- **Exit criteria:** Analytics and Reports screens run on real aggregated data, weekly/monthly briefs generate and export

### Phase 7 — Admin & System
- Workspace settings, webhooks CRUD + dispatch worker, API keys CRUD, audit log stream
- Billing/subscription fields (even if billing itself isn't wired to a payment provider yet — structure ready for multi-tenant sale)
- **Exit criteria:** Admin Settings screen fully functional; system is genuinely ready to onboard a second organization

### Phase 8 — Hardening & Scale-readiness
- Rate limiting, pagination audit across all list endpoints, N+1 query audit on relationship/graph endpoints
- Background job queue formalized (report generation, PDF export, webhook dispatch, graph cache refresh) if not already using one
- Load-test the multi-tenant isolation (confirm no cross-org data leakage under concurrent load)
- **Exit criteria:** system is ready to onboard the second paying organization safely

---

## 8. Cross-Cutting Concerns to Track Throughout (not a phase, ongoing)

- **Multi-tenancy isolation tests**: every new endpoint gets a test asserting org A cannot see org B's data.
- **RBAC tests**: every new endpoint gets a test matrix across the 7 roles.
- **Audit logging**: admin-sensitive actions (role changes, tag governance changes, webhook/API key changes) write to `audit_logs` from day one, not bolted on later.
- **API versioning**: stick to the `/api/v1/` prefix from the spec; don't break it once mobile or third-party integrations exist.
