# Pulse — Intelligent Team Alignment & Execution Engine

**Pulse** is a modern, cross-platform productivity and operational management platform designed to eliminate organizational silos, connect daily tasks to strategic company goals, and provide clear real-time visibility across teams.

Available on both **Web Browsers** and as a **Native Desktop Application (Electron)**.

---

## 🌟 What is Pulse?

Pulse solves the fragmentation between high-level executive strategy and daily individual execution. Instead of managing tasks, goals, and team updates in disconnected tools, Pulse unifies them into a single interactive workspace.

### Core Experience & Workflow (User Perspective)

#### 1. 🎭 Role-Based Access & Simulation Mode
Pulse features a built-in **Role Switcher** at the top of the interface allowing users and managers to experience the app from different organizational perspectives:
- **Executive / Director**: Focuses on company-wide Pulse Scores, OKR alignment, portfolio health, and high-level blocker summaries.
- **Engineering Manager / Team Lead**: Focuses on team velocity, daily check-in (EOD) submissions, resolving flagged blockers, and task delegation.
- **Individual Contributor**: Focuses on personal task queues, daily pulse check-ins, project contributions, and peer collaboration.
- **Admin**: Manages system privileges, role matrix configurations, tags, and workspace settings.

---

#### 2. 🕸️ Interactive Relationship Graph (Obsidian-Style Network)
Explore your organization as a living, interconnected ecosystem:
- **Visual Node Graph**: Interactive canvas displaying dynamic links between **People**, **Teams**, **Projects**, **Goals**, and **Tags**.
- **Interactive Inspection**: Click on any node to view detailed metrics, linked items, and folder hierarchies in a stacked side drawer.
- **Physics Layout & Filters**: Pan, zoom, and filter by entity type or tag to trace cross-team dependencies.

---

#### 3. ⏱️ Daily Pulse Check-ins (EOD Tracking)
Eliminate long, repetitive standup meetings with asynchronous daily check-ins:
- **Quick EOD Submission**: Share what you accomplished today, planned tasks for tomorrow, and confidence ratings.
- **Manager Blocker Flagging**: Instantly flag critical blockers directly to your manager for immediate assistance.
- **Daily Digest**: View team-wide updates at a glance.

---

#### 4. 📋 Execution Hub (Tasks, Projects & Goals)
- **Task Management**: Create, assign, filter, and track tasks across different states (*To Do*, *In Progress*, *In Review*, *Done*, *Blocked*).
- **Projects & Milestones**: Monitor project status, budget allocation, owner assignments, and completion percentages.
- **Strategic OKRs & Goals**: Link day-to-day tasks directly to key business objectives to ensure every task drives measurable impact.

---

#### 5. 📊 Analytics, Reports & Operations
- **Pulse Score**: A real-time index representing organizational alignment and momentum.
- **Blocker Escalation Tracker**: Spot recurring bottlenecks before they delay deadlines.
- **Executive Reports**: Generate clear summaries of sprint progress, velocity, and team throughput.

---

#### 6. 🔍 Omni Global Search & In-App Assistance
- **Command Palette (`Ctrl + K`)**: Instantly search for any task, project, person, or goal from anywhere in the app.
- **In-App Toast Notifications & Slide-Over Drawer**: Inspect entity details without losing your place in the current screen.

---

## 🖥️ Cross-Platform Support

Pulse is built to work seamlessly on modern web browsers and desktop operating systems:
- **Browser Web App**: Lightweight, fast, and accessible on any device.
- **Native Desktop App (Electron)**: Integrated desktop window, system tray options, and native performance.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (included with Node.js)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Pulse

# Install dependencies
npm install
```

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| **`npm run dev`** | Starts the Vite web development server (accessible at `http://localhost:5173`). |
| **`npm run electron:dev`** | Starts the Vite server and launches the **Electron Desktop App** concurrently in dev mode. |
| **`npm run build`** | Builds the production-ready web application bundle into `dist/`. |
| **`npm run build:electron-main`** | Compiles the TypeScript main & preload process scripts for Electron into `dist-electron/`. |
| **`npm run electron:build`** | Builds the full desktop installer (`.exe` for Windows) into the `release/` folder. |
| **`npm run preview`** | Locally previews the production web build. |

---

## 🏗️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Animations**: Framer Motion
- **Desktop Runtime**: Electron, Electron-Builder, Tsup
- **Charts & Visualization**: Recharts, D3 Array & Interpolate

---

## 📄 License

Private & Confidential — Created for Epicordia / Pulse Team.
