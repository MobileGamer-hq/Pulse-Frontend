# PulseBackend API Reference & Workflow Breakdown

This document provides an end-to-end architectural flow breakdown and a comprehensive specification of every API endpoint in PulseBackend.

---

## 1. System Execution & Workflow Sequence

```mermaid
flowchart TD
    subgraph 1. Authentication & Onboarding
        A[User Registers / Logs in via Supabase Auth] --> B[POST /api/v1/auth/user-sync]
        B --> C{Organization Choice}
        C -->|Option A: Create New Org| D[POST /api/v1/organizations]
        C -->|Option B: Join Existing Org| E[Admin: POST /api/v1/organizations/invites]
        E --> F[User: POST /api/v1/auth/invite/accept]
        D --> G[POST /api/v1/organizations/switch]
        F --> G
    end

    subgraph 2. Core Operations & Execution
        G --> H[Create / View Teams & Tags]
        H --> I[POST /api/v1/goals - Define OKRs & Key Results]
        I --> J[POST /api/v1/tasks - Create & Assign Tasks linked to Goals]
        J --> K[Update Tasks: Subtasks, Comments, Status Changes]
        K --> L[Daily Pulse: POST /api/v1/pulse/eod]
    end

    subgraph 3. Reports, Analytics & Admin
        L --> M[POST /api/v1/reports/generate & PDF Export]
        L --> N[GET /api/v1/analytics/team-health & Dossier]
        L --> O[Admin Audit Logs, Webhooks & Workspace Settings]
    end
```

### End-to-End User Flow Explained
1. **Account Registration**: User authenticates with Supabase -> Calls `POST /api/v1/auth/user-sync` to initialize their global profile in PulseBackend.
2. **Tenant Onboarding**:
   - To **found an organization**: Call `POST /api/v1/organizations`. User is assigned the `Admin` role in `organization_memberships`.
   - To **join an organization**: An existing Admin calls `POST /api/v1/organizations/invites` to generate an invite token. The invited user calls `POST /api/v1/auth/invite/accept` with the token.
3. **Context Selection**: Call `POST /api/v1/organizations/switch` with `orgSlug` to activate the target tenant scope in `TenantContext`.
4. **Daily Operations**:
   - Teams & Tags are created (`/api/v1/teams`, `/api/v1/tags`).
   - Strategic OKRs/Goals are defined (`/api/v1/goals`).
   - Execution tasks are created, assigned, and updated (`/api/v1/tasks`).
   - Team members submit End-of-Day (EOD) logs (`/api/v1/pulse/eod`).
5. **Insights & Governance**:
   - Managers generate AI/Weekly performance reports (`/api/v1/reports/generate`).
   - Admins track audit logs, webhooks, and team health metrics (`/api/v1/admin/*`, `/api/v1/analytics/*`).

---

## 2. Global Request Headers

| Header | Required | Value |
| :--- | :--- | :--- |
| `Content-Type` | Yes (for POST/PUT/PATCH) | `application/json` |
| `Authorization` | Yes (for protected routes) | `Bearer <SUPABASE_JWT_TOKEN>` |

---

## 3. Comprehensive Endpoint Breakdown by Module

### A. Authentication Module (`/api/v1/auth`)

1. **`POST /api/v1/auth/user-sync`**
   - **Purpose**: Creates or updates the global user account profile after Supabase Auth login.
   - **Auth**: Bearer Token or request body.
   - **Body Schema**: `{ "supabaseUserId": UUID, "email": String, "name": String }`

2. **`POST /api/v1/auth/invite/accept`**
   - **Purpose**: Accepts an organization invitation token and adds the user as a member.
   - **Auth**: Bearer Token or request body.
   - **Body Schema**: `{ "token": String, "supabaseUserId": UUID }`

3. **`POST /api/v1/auth/register`**
   - **Purpose**: Legacy endpoint for bootstrapping an organization and owner user together.
   - **Body Schema**: `{ "orgName": String, "slug": String, "email": String, "creatorName": String, "supabaseUserId": UUID }`

4. **`POST /api/v1/auth/login`**
   - **Purpose**: Validates login request credentials.
   - **Body Schema**: `{ "email": String, "password": String }`

5. **`GET /api/v1/auth/me`**
   - **Purpose**: Retrieves the authenticated user's profile based on the JWT subject ID.
   - **Auth**: Bearer Token.

---

### B. Organizations Module (`/api/v1/organizations`)

1. **`POST /api/v1/organizations`**
   - **Purpose**: Creates a new organization for the logged-in user and sets them as Admin.
   - **Auth**: Bearer Token (or `userId` in body for dev testing).
   - **Body Schema**: `{ "orgName": String, "slug": String, "userId": UUID }`

2. **`POST /api/v1/organizations/invites`**
   - **Purpose**: Generates a 7-day invitation token for an email address.
   - **Role Required**: `Admin`, `Executive`, `Manager`
   - **Body Schema**: `{ "email": String, "role": String }` *(role: Admin, Executive, HR, Manager, TeamLead, Member, Contractor)*

3. **`GET /api/v1/organizations/me`**
   - **Purpose**: Lists organizations accessible in current tenant context.

4. **`POST /api/v1/organizations/switch`**
   - **Purpose**: Switches active organization scope for tenant operations.
   - **Body Schema**: `{ "orgSlug": String }`

5. **`GET /api/v1/organizations/by-slug/{slug}`**
   - **Purpose**: Fetch organization metadata by unique slug.
   - **Path Variable**: `slug` (String)

---

### C. Teams & Users Modules (`/api/v1/teams`, `/api/v1/users`)

1. **`GET /api/v1/teams`**
   - **Purpose**: List all teams within current organization.

2. **`GET /api/v1/teams/{id}`**
   - **Purpose**: Get specific team details.
   - **Path Variable**: `id` (UUID)

3. **`POST /api/v1/teams`**
   - **Purpose**: Create a new team.
   - **Query Parameters**: `name` (String, required), `workflowTemplate` (String, optional)

4. **`GET /api/v1/users`**
   - **Purpose**: List all user members in current organization.

5. **`GET /api/v1/users/{id}`**
   - **Purpose**: Get specific user details.
   - **Path Variable**: `id` (UUID)

6. **`PATCH /api/v1/users/{id}`**
   - **Purpose**: Update user role, capacity hours, or assigned team.
   - **Path Variable**: `id` (UUID)
   - **Query Parameters**: `role` (Enum), `capacityHours` (Integer), `teamId` (UUID)

---

### D. Tasks Module (`/api/v1/tasks`)

1. **`GET /api/v1/tasks`**
   - **Purpose**: Fetch filtered list of tasks.
   - **Query Parameters** *(all optional)*: `q` (String), `tagIds` (List<UUID>), `statuses` (List<TaskStatus>), `assigneeIds` (List<UUID>), `priorities` (List<TaskPriority>), `projectIds` (List<UUID>), `hasBlockerOnly` (Boolean), `startDate` (ISO Date), `endDate` (ISO Date)

2. **`POST /api/v1/tasks`**
   - **Purpose**: Create a new task.
   - **Role Required**: `Admin`, `Manager`, `TeamLead`, `Member`
   - **Body Schema**: `{ "projectId": UUID, "title": String, "description": String, "status": TaskStatus, "priority": TaskPriority, "assigneeIds": List<UUID>, "estimatedHours": BigDecimal, "actualHours": BigDecimal, "dueDate": LocalDate, "startDate": LocalDate, "tagIds": List<UUID>, "linkedGoalId": UUID, "dependencyTaskIds": List<UUID>, "blockedReason": String }`

3. **`GET /api/v1/tasks/{id}`**
   - **Purpose**: Get task details by ID.
   - **Path Variable**: `id` (UUID)

4. **`PATCH /api/v1/tasks/{id}`**
   - **Purpose**: Partial update of task fields.
   - **Role Required**: `Admin`, `Manager`, `TeamLead`, `Member`
   - **Body Schema**: Same fields as TaskCreateDTO (all optional).

5. **`DELETE /api/v1/tasks/{id}`**
   - **Purpose**: Delete task by ID.
   - **Role Required**: `Admin`, `Manager`, `TeamLead`

6. **`PUT /api/v1/tasks/reorder`**
   - **Purpose**: Reorder task list for board/list view.
   - **Body Schema**: `{ "orderedTaskIds": List<UUID> }`

7. **`POST /api/v1/tasks/{id}/subtasks`**
   - **Purpose**: Add subtask to a parent task.
   - **Body Schema**: `{ "title": String }`

8. **`PATCH /api/v1/tasks/{id}/subtasks/{subtaskId}`**
   - **Purpose**: Toggle completion status of a subtask.

9. **`POST /api/v1/tasks/{id}/comments`**
   - **Purpose**: Add discussion comment to task.
   - **Body Schema**: `{ "authorId": String, "authorName": String, "text": String }`

---

### E. Goals & Key Results Module (`/api/v1/goals`)

1. **`GET /api/v1/goals`**
   - **Purpose**: List organization goals and linked Key Results.

2. **`POST /api/v1/goals`**
   - **Purpose**: Create goal / OKR.
   - **Role Required**: `Admin`, `Executive`, `Manager`
   - **Body Schema**: `{ "title": String, "description": String, "ownerType": GoalOwnerType, "ownerId": UUID, "targetDate": LocalDate, "status": GoalStatus, "tagIds": List<UUID>, "keyResults": List<{ "title": String, "targetValue": BigDecimal, "currentValue": BigDecimal, "unit": String, "linkedTaskIds": List<UUID> }> }`

3. **`GET /api/v1/goals/{id}`**
   - **Purpose**: Get specific goal by ID.

4. **`PATCH /api/v1/goals/{id}`**
   - **Purpose**: Update goal status/details.
   - **Role Required**: `Admin`, `Executive`, `Manager`

5. **`PUT /api/v1/goals/reorder`**
   - **Purpose**: Reorder goal hierarchy.
   - **Body Schema**: `{ "orderedGoalIds": List<UUID> }`

6. **`PATCH /api/v1/goals/{id}/key-results/{krId}`**
   - **Purpose**: Update progress value of a Key Result metric.
   - **Body Schema**: `{ "currentValue": BigDecimal }`

---

### F. Pulse / End-of-Day (EOD) Module (`/api/v1/pulse`)

1. **`POST /api/v1/pulse/eod`**
   - **Purpose**: Submit End-of-Day progress entry, accomplishments, blockers, and energy index (1-5).
   - **Body Schema**: `{ "date": LocalDate, "accomplishments": List<String>, "completedTaskIds": List<UUID>, "blockers": String, "blockedTaskId": UUID, "energyIndex": Integer, "flaggedToManager": Boolean }`

2. **`GET /api/v1/pulse/eod`**
   - **Purpose**: Retrieve EOD entries.
   - **Query Parameters**: `date` (ISO Date), `teamId` (UUID), `userId` (UUID)

3. **`GET /api/v1/pulse/summary`**
   - **Purpose**: Retrieve daily team pulse summary and blocker aggregation.
   - **Query Parameter**: `date` (ISO Date)

---

### G. Reports & Analytics Module (`/api/v1/reports`, `/api/v1/analytics`)

1. **`GET /api/v1/reports`**
   - **Purpose**: List generated reports.
   - **Role Required**: `Admin`, `Executive`, `HR`, `Manager`, `TeamLead`, `Member`

2. **`POST /api/v1/reports/generate`**
   - **Purpose**: Trigger async report generation (`WEEKLY_SUMMARY`, `EXECUTIVE_DOSSIER`, `TEAM_HEALTH`, `PROJECT_VELOCITY`).
   - **Role Required**: `Admin`, `Executive`, `Manager`
   - **Body Schema**: `{ "type": ReportType, "periodLabel": String }`

3. **`GET /api/v1/analytics/dossier/{userId}`**
   - **Purpose**: Fetch comprehensive executive dossier metrics for a specific user.

4. **`GET /api/v1/analytics/team-health`**
   - **Purpose**: Fetch team health, workload, and velocity analytics.

5. **`POST /api/v1/reports/{id}/export-pdf`**
   - **Purpose**: Export generated report as binary PDF file.

---

### H. Admin Module (`/api/v1/admin`)

1. **`GET /api/v1/admin/audit-logs`**
   - **Purpose**: Fetch security audit logs.
   - **Role Required**: `Admin`, `Executive`

2. **`GET /api/v1/admin/workspace`**
   - **Purpose**: Fetch workspace settings.

3. **`PUT /api/v1/admin/workspace`**
   - **Purpose**: Update workspace settings.
   - **Role Required**: `Admin`

4. **`GET /api/v1/admin/webhooks`** & **`POST /api/v1/admin/webhooks`** & **`DELETE /api/v1/admin/webhooks/{id}`**
   - **Purpose**: Manage webhook integrations.
   - **Role Required**: `Admin`
   - **Create Body Schema**: `{ "name": String, "url": String, "events": List<String> }`

5. **`GET /api/v1/admin/api-keys`** & **`POST /api/v1/admin/api-keys`** & **`DELETE /api/v1/admin/api-keys/{id}`**
   - **Purpose**: Manage organization API keys.
   - **Role Required**: `Admin`
   - **Create Body Schema**: `{ "name": String }`

---

### I. Notifications, Tags, Saved Views, Search, Relationships & Support

1. **Notifications (`/api/v1/notifications`)**:
   - `GET /api/v1/notifications`: List notifications (`type`, `unreadOnly`).
   - `PATCH /api/v1/notifications/{id}/read`: Mark notification read.
   - `PATCH /api/v1/notifications/read-all`: Mark all read.
   - `POST /api/v1/notifications/{id}/comments`: Comment on notification (`{ "user": String, "text": String }`).
   - `GET/PUT /api/v1/notifications/settings`: Manage notification preferences.

2. **Tags (`/api/v1/tags`)**:
   - `GET /api/v1/tags`: List organization tags.
   - `POST /api/v1/tags`: Create tag (`{ "name": String, "color": String }`).
   - `PATCH /api/v1/tags/{id}`: Soft-delete tag.
   - `PUT /api/v1/tags/reorder`: Reorder tag array.
   - `GET /api/v1/tags/{id}/usage`: Tag usage metrics.

3. **Saved Views (`/api/v1/saved-views`)**:
   - `GET /api/v1/saved-views`: List saved task filter views.
   - `POST /api/v1/saved-views`: Save filter view (`{ "name": String, "filtersJson": String }`).
   - `DELETE /api/v1/saved-views/{id}`: Delete saved view.

4. **Relationships Graph (`GET /api/v1/relationships/graph?projectId=...`)**:
   - Returns dependency graph nodes and edges for task/goal visualization.

5. **Search (`GET /api/v1/search?q=...`)**:
   - Multi-entity global search across tasks, goals, projects, and users.

6. **Support Tickets (`POST /api/v1/support/tickets`)**:
   - Submit support ticket (`{ "subject": String, "category": String, "message": String }`).
