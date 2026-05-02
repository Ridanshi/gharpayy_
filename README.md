# FlowOps AI

**AI-Assisted Operations Intelligence Platform for PG Reservation & Lead Management**

![MERN](https://img.shields.io/badge/Stack-MERN-2f855a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47a248?style=flat-square)
![Status](https://img.shields.io/badge/Status-MVP%20Ready-f97316?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-111827?style=flat-square)

FlowOps AI is a modern MERN-stack operational intelligence platform built for PG reservation and housing operations teams. It combines lead management, property inventory intelligence, reservation workflows, tour scheduling, role-aware dashboards, operational analytics, and AI-assisted prioritization into a single command system.

The product is designed to feel like an internal SaaS platform used by a fast-growing housing startup: responsive, operationally focused, data-connected, and polished enough for investor or recruiter review.

---

## Why This Project Exists

Traditional CRMs mostly store customer data. They often fail to answer the operational question that matters most:

> What should the team do next to convert demand into occupancy?

FlowOps AI is built around execution rather than passive reporting. It helps teams track follow-ups, identify stale leads, schedule visits, monitor inventory pressure, coordinate reservations, and prioritize the work that directly impacts revenue.

In short, FlowOps AI is an operational command system instead of a passive dashboard.

---

## Key Features

### Operational Intelligence

- AI-assisted lead intent scoring
- Lead urgency and stale-lead detection
- Next-best-action recommendations
- Revenue Revival Queue for cold or inactive high-value leads
- Live operational activity feed
- Property Pressure Index for inventory health

### CRM & Pipeline

- Lead lifecycle management
- Searchable and filterable lead workspace
- Stage updates with reactive analytics
- Notes, calls, tasks, and activity timelines
- Follow-up scheduling
- Role-aware workflows for Admin, Sales Ops, and Sales Agent users

### Inventory & Reservations

- Property inventory management
- Room and occupancy tracking
- Reservation lifecycle management
- Deposit and payment status tracking
- Availability monitoring
- Property creation with image preview support

### Analytics

- Conversion analytics
- Revenue trend tracking
- Occupancy insights
- Agent performance views
- Lead source analytics
- Exportable CSV and JSON reports

### UX Features

- Responsive SaaS dashboard layout
- Persistent dark/light mode
- Command palette
- Toast notifications
- Loading skeletons
- Interactive dashboards and charts
- Smooth modal and page transitions

---

## Product Philosophy

FlowOps AI is designed around three product principles:

| Principle | Meaning |
| --- | --- |
| Operational first | Every screen should help the team take action, not just view records. |
| Intelligence with explainability | Scores and recommendations should be understandable and traceable. |
| Role-aware execution | Admins, Ops teams, and Agents need different priorities, KPIs, and workflows. |

The UI intentionally avoids a generic admin-panel feel. It is built to resemble a premium internal SaaS product with strong hierarchy, dark-mode polish, tactile cards, and command-center-style workflows.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, TypeScript, TailwindCSS, shadcn-style UI components |
| UI/UX | Framer Motion, Lucide React, Recharts |
| State & Data | TanStack Query, Zustand |
| Forms & Validation | React Hook Form patterns, Zod-ready architecture, inline validation |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt |
| Deployment | Vercel for frontend, Render/Railway for backend |

---

## System Architecture

```text
Client App (React + Vite)
        |
        | REST API requests
        v
Express API Server
        |
        | Mongoose models and services
        v
MongoDB Atlas
```

The application uses a modular MERN architecture:

- React frontend with feature-based modules
- TanStack Query for server-state synchronization
- Zustand for lightweight global UI/session state
- Express routes organized by domain
- Controllers for request handling
- Services for operational intelligence calculations
- Mongoose schemas for relationships and persistence
- JWT middleware for protected and role-aware access

---

## Folder Structure

```text
FlowOps-AI/
├── client/
│   ├── src/
│   │   ├── app/              # Router and app-level setup
│   │   ├── components/       # Shared UI and layout components
│   │   ├── features/         # Dashboard, leads, visits, inventory, analytics
│   │   ├── lib/              # API client and utilities
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # Shared frontend types
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/           # Environment and DB config
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth and error middleware
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API route definitions
│   │   ├── seed/             # Demo data seeding
│   │   ├── services/         # Intelligence and scoring services
│   │   └── utils/            # Shared backend utilities
│   └── tsconfig.json
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Core Modules

### Dashboard

Role-aware command center with KPIs, charts, live activity, AI insights, revival queues, inventory pressure, and urgent operational tasks.

### Leads

Central workspace for managing prospects across the reservation funnel. Leads include lifecycle stage, assignment, source, budget, preferred location, activity history, notes, calls, tasks, and AI intent scoring.

### Pipeline

Kanban-style lead progression across stages such as New, Contacted, Tour Scheduled, Negotiation, Reserved, and Closed Won.

### Tours

Operational calendar for scheduled property visits. Supports month/week views, tour status updates, check-ins, no-shows, completion, and rescheduling.

### Inventory

Property management system with occupancy tracking, image previews, amenities, room availability, demand indicators, and Property Pressure Index calculations.

### Reservations

Tracks room reservation lifecycle, deposit status, monthly rent, payment state, move-in date, and assigned ownership.

### Analytics

Conversion funnels, revenue trends, lead source analytics, occupancy insights, property performance, and exportable reports.

### Notifications

Lightweight operational notification system for overdue follow-ups, assignments, reservations, inventory alerts, and task reminders.

---

## Operational Intelligence Layer

FlowOps AI is intentionally honest about its current intelligence model.

The platform does **not** claim to use advanced machine learning in this MVP. It currently uses deterministic, rule-based operational intelligence designed to be explainable and reliable.

The scoring engine evaluates signals such as:

- Lead inactivity duration
- Lifecycle stage
- Property views
- Pricing views
- Follow-up overdue state
- Tour completion
- Negotiation stage
- Reservation intent
- Move-in urgency

This generates:

- AI Intent Score
- Hot/Warm/Cold/At Risk labels
- Ghosted lead detection
- Stale lead detection
- Next-best-action suggestions
- Revival recommendations
- Property pressure calculations

The architecture is designed so this rule-based service can later be replaced or augmented by ML models, LLM-based recommendations, or predictive forecasting pipelines.

---

## Role-Based Dashboards

| Role | Focus | Example KPIs and Workflows |
| --- | --- | --- |
| Founder/Admin | Business intelligence and strategic overview | Revenue, occupancy, conversion, forecasting, property performance |
| Sales Ops | Operational coordination and queue management | Overdue follow-ups, tours pending, unassigned leads, escalations |
| Sales Agent | Personal execution workspace | Assigned leads, tours today, follow-ups due, active negotiations |

Each role uses the same design system and navigation shell, but sees different priorities, quick actions, KPIs, and operational widgets.

---

## Screenshots

Add screenshots after deployment or demo capture.

### Dashboard

![Dashboard Screenshot](./screenshots/dashboard.png)

### Leads Module

![Leads Screenshot](./screenshots/leads.png)

### Tours Calendar

![Tours Screenshot](./screenshots/tours.png)

### Inventory Management

![Inventory Screenshot](./screenshots/inventory.png)

---

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | [admin@flowops.ai](mailto:admin@flowops.ai) | `FlowOps@123` |
| Ops | [ops@flowops.ai](mailto:ops@flowops.ai) | `FlowOps@123` |
| Agent | [agent@flowops.ai](mailto:agent@flowops.ai) | `FlowOps@123` |

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flowops-ai.git
cd flowops-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create environment files for both apps:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

If `.env.example` files are not present yet, use the templates below.

### 4. Start MongoDB

Using Docker:

```bash
docker compose up -d
```

Or use MongoDB Atlas and update `MONGODB_URI`.

### 5. Seed demo data

```bash
npm run seed
```

---

## Environment Variables

### Backend `server/.env`

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/flowops-ai
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend `client/.env`

```env
VITE_API_URL=http://localhost:8080/api
```

Never commit real secrets or production database credentials.

---

## Running Locally

Run the full application:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8080
```

Run individual workspaces:

```bash
npm run dev --workspace client
npm run dev --workspace server
```

Build for production:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

---

## API Architecture

The backend follows a scalable REST API structure:

```text
routes -> controllers -> services/models -> response
```

Key API areas:

| Endpoint | Purpose |
| --- | --- |
| `/api/auth` | Login and authenticated session retrieval |
| `/api/leads` | Lead CRUD, notes, calls, visits, stage updates |
| `/api/properties` | Property inventory and occupancy workflows |
| `/api/reservations` | Reservation lifecycle and payment status |
| `/api/visits` | Tour scheduling and visit status updates |
| `/api/tasks` | Follow-up and operational task management |
| `/api/analytics` | Analytics and reporting data |
| `/api/dashboard` | Role-aware dashboard payload |

Middleware includes JWT authentication, role authorization, centralized error handling, rate limiting, CORS, and secure headers.

---

## Database Design

FlowOps AI uses MongoDB with Mongoose models.

| Collection | Purpose |
| --- | --- |
| Users | Admin, Sales Ops, and Sales Agent accounts |
| Leads | Prospects, funnel stages, activity, scoring signals |
| Properties | PG inventory, rooms, occupancy, amenities, pressure metrics |
| Reservations | Booking lifecycle, deposit tracking, rent, move-in details |
| Visits | Scheduled tours, check-ins, no-shows, completions |
| Tasks | Follow-ups, reminders, operational work queues |
| Activities | Live operational feed events |
| Notifications | User-facing alerts and reminders |
| Notes | Lead-specific notes and context |

Relationships are maintained with Mongoose references between leads, users, properties, reservations, visits, and activities.

---

## Deployment

### Frontend: Vercel

Recommended settings:

```text
Framework: Vite
Root Directory: client
Build Command: npm run build --workspace client
Output Directory: client/dist
```

Set:

```env
VITE_API_URL=https://your-backend-url.com/api
```

### Backend: Render or Railway

Recommended settings:

```text
Root Directory: server
Build Command: npm install && npm run build --workspace server
Start Command: npm run start --workspace server
```

Set:

```env
PORT=8080
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-app.vercel.app
```

---

## Engineering Highlights

- Built a full MERN SaaS platform with production-style frontend and backend architecture
- Designed role-aware dashboards for three distinct operational users
- Implemented reactive workflows using TanStack Query cache invalidation and optimistic updates
- Created a deterministic operational intelligence layer for explainable scoring
- Built property pressure and occupancy intelligence from live inventory data
- Added real CSV/JSON analytics exports from application data
- Implemented persistent theme management and responsive dark-mode UI
- Connected activities, notifications, timelines, reservations, tours, and analytics into one system
- Added global error boundaries, defensive form handling, validation, and stable modal workflows

---

## Challenges Solved

- Avoided a generic CRUD experience by building workflows around operational execution
- Created differentiated dashboards for Admin, Ops, and Agent roles without splitting the app
- Built explainable scoring instead of making unrealistic AI claims
- Connected lead, reservation, visit, task, inventory, and analytics state across modules
- Stabilized image upload previews, property creation, exports, and calendar interactions
- Improved demo readiness with seed data, role credentials, and deployment-friendly structure

---

## Future Improvements

- Real ML-based lead conversion model
- WhatsApp Business integration
- Email and SMS automation
- Calendar sync with Google Calendar
- Real-time activity updates with WebSockets
- Payment gateway integration
- Advanced report builder and PDF exports
- Predictive occupancy forecasting
- Multi-city and multi-branch support
- Fine-grained permission management

---

## License

This project is available under the MIT License.

---

## Author

Built as a production-quality full-stack SaaS MVP for PG reservation, lead management, and operations intelligence.
