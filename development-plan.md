# Pulse — Development Plan & Execution Roadmap

**Product:** Pulse — Work & Performance Dashboard  
**Status:** In Development Phase 1  
**Architecture:** Multi-Tenant Ready Web Application  

---

## 1. Executive Summary

Pulse is a web-based work management and performance tracking dashboard designed for both software teams and non-technical teams (agencies, operations, marketing). Key pillars of the platform include:
1. **Monochrome-first visual design system** with strict icon/stroke weight status indicators (no emojis, colors reserved strictly for curated tags).
2. **Universal Entity Connectivity & Cross-Linking**, slide-over details, bidirectional relationship panels, and an interactive Relationship Map node-graph.
3. **Daily Pulse EOD Check-in System** featuring accomplishment pre-fills, blocker flagging, and a 5-point gauge energy/satisfaction index.
4. **Rich Multi-View Task Engine** (Kanban, List, Timeline/Gantt, Workload Map) with persistent saved filter views.
5. **Role-Based Access Control (RBAC)** across Organization, Team, and Individual tiers.

---

## 2. Technical Stack & Foundation

- **Framework:** React 18+ / Vite with TypeScript
- **Styling:** Tailwind CSS + Custom Monochrome & Tag Design Tokens
- **Icons:** Lucide React (`lucide-react`) with strict stroke weight rules
- **Animations:** Framer Motion for slide-over panels, spring transitions, and view layout shifts
- **Charts & Data Viz:** Recharts / Custom SVG for burn-down, velocity, energy index trends, and OKR progress rollups
- **Interactive Graph:** Interactive Canvas/SVG Node Graph for the Relationship Map (Project ↔ People ↔ Tasks ↔ Goals)
- **PDF Generation:** HTML2Canvas / jsPDF integration for Weekly/Monthly Executive Briefs

---

## 3. Core Milestones & Phased Execution

### Phase 1: Project Initialization & Core Framework
- [x] Analyze Design Document & Architecture Requirements
- [x] Initialize React + Vite + TypeScript application
- [x] Install dependencies: `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`, `framer-motion`, `recharts`, `canvas-confetti`
- [ ] Set up Monochrome Design Tokens in CSS (Light `#F4F5F7` default, Dark `#0F1115` support, Muted Tag Swatches)

### Phase 2: Design System & Shared Connected Infrastructure
- [ ] **Universal Entity Reference Component System**: Reusable click/hover entity chips (`<EntityLink type="person|project|task|goal|tag" id="..." />`)
- [ ] **Slide-Over Panel & Stacked Drawer Navigation**: Interactive slide-overs with breadcrumbs (e.g. Person Profile → Project Detail → Task Detail)
- [ ] **Hover Card Previews**: Light preview popovers for People, Projects, Tasks, and Goals
- [ ] **Global Connected Search Modal (`Ctrl+K` / `Cmd+K`)**: Unified search across all entities
- [ ] **Interactive Role & Tenant Switcher Bar**: Live toggle between Admin, Executive, HR, Manager, Team Lead, Member, Contractor to test RBAC rules on the fly

### Phase 3: Domain Modules & Core Screens

#### Module A: Dashboard & Role Views
- Role-aware home screen (IC view: Today's Tasks + Daily Pulse prompt; Executive/Manager view: Team Pulse feed, Risk Matrix, OKR highlights)

#### Module B: Work & Task Engine (Multi-View)
- Single screen with view switcher: **Kanban Board**, **List View**, **Timeline / Gantt View**, **Workload Map**
- Rich task filters: Tag multi-select (color swatches), Status, Assignee, Priority, Project, Due date range, Blocker flag, AND/OR logic
- Saved & Pinned Filter Views (e.g. "My Urgent Frontend Bugs")

#### Module C: Daily Pulse (EOD Check-in) & Manager Feed
- Step 1: Accomplishments (pre-filled from tasks completed today + free text)
- Step 2: Blockers (free text + optional task linking & instant manager alert flag)
- Step 3: Energy / Satisfaction Index (5-point gauge icon fill levels)
- Manager Aggregated EOD Feed: scannable card wall with sentiment filter and blocker alerts

#### Module D: Identity, RBAC & Person Profile
- Full Person Profile slide-over: cross-project assigned tasks, team membership, goals owned, EOD history timeline, and tags

#### Module E: Projects & Relationship Map
- Project Detail: scoped tasks, assigned team, linked goals, tags, and **Interactive Node-Graph Relationship Map** (visualizing Project ↔ People ↔ Tasks ↔ Goals with zoom/pan)

#### Module F: Goals & OKRs
- Objectives → Key Results → Linked Tasks with automatic percentage progress rollup

#### Module G: Tagging & Governance
- Tag Detail screen (clicking any tag chip lists every task/project/person/goal carrying that tag org-wide)
- Admin Tag Manager (governed creation of 12 muted color swatches)

#### Module H: Reports & Analytics
- Individual Dossier (completion rate, turnaround speed, EOD consistency, output trend)
- Team Health (capacity vs output, burn-down chart, bottleneck detection)
- Weekly & Monthly Generated Briefs with PDF Export trigger

---

## 4. Quality Assurance & Verification Criteria
1. Strict visual adherence: No emojis, monochrome-first palette, icon-weight status indicators.
2. Complete entity cross-linking: Zero broken or non-interactive entity references.
3. Smooth side-panel stacking & hover preview experience.
4. Comprehensive mock data covering software sprint workflows and non-tech marketing campaigns.
