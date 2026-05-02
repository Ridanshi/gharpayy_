# FlowOps AI Architecture

FlowOps AI is structured as a workspace monorepo with isolated deployable apps:

- `client`: React/Vite SaaS frontend with feature-based modules.
- `server`: Express/Mongoose API with layered routes, controllers, services, middleware, validation, and models.

## Product Modules

- Operations dashboard with KPI cards, AI insights, funnel, revenue, feed, pressure index, revival queue.
- Lead management with search, filters, ownership, AI scoring, stage tracking, notes, tasks, visits, recommendations.
- Pipeline board with drag-and-drop stage movement and optimistic UI updates.
- Visit management with calendar/list views, reminders, feedback, and check-in states.
- PG inventory with pressure scoring, rooms, pricing, amenities, and property detail pages.
- Reservations with lifecycle tracking, deposit status, tenant onboarding, and revenue impact.
- Analytics dashboards for source, funnel, agent, occupancy, booking, and property performance.

## Backend Layers

- Models define production-ready relationships and indexes.
- Controllers handle HTTP concerns only.
- Services implement AI scoring, dashboard aggregation, property matching, and seed generation.
- Middleware handles JWT authentication, role guards, request errors, and centralized responses.
- Routes are versioned under `/api`.

## Intelligence Layer

The AI engine is deterministic and explainable. It derives urgency, conversion probability, next best action, ghosting risk, stale lead risk, and revival recommendations from lead behavior, stage, follow-up age, budget fit, tour activity, and activity recency.

## Roles

- Admin: full access.
- Sales Ops: operations and assignment access.
- Sales Agent: lead, visit, and task execution access.

## Deployment Model

The frontend is static and Vercel-ready. The backend is stateless and Render/Railway-ready. MongoDB Atlas is the source of truth.
