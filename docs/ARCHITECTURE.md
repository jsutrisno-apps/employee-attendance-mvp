# Employee Attendance Architecture

## Purpose

This document defines the recommended architecture and technology stack for the Employee Attendance MVP.

The goal is to support the approved MVP in `docs/MVP_SCOPE.md` with the smallest practical architecture for local development, validation, deployment, learning, and portfolio use.

This is a decision-only stage. It does not create an application scaffold, database schema, migrations, authentication configuration, routes, UI, tests, CI workflows, or deployment resources.

## Architecture Overview

Employee Attendance should be built as one monolithic web application backed by one PostgreSQL database.

Recommended shape:

- one Next.js application;
- one PostgreSQL database;
- server-rendered and server-protected application flows where practical;
- server-side authorization for Admin and Employee access;
- one deployment unit for the web application;
- one managed PostgreSQL database in production.

The MVP does not need microservices, event-driven architecture, queues, distributed systems, Kubernetes, policy engines, or a separate backend service.

## Approved Technology Stack

| Area | Recommendation |
| --- | --- |
| Framework | Next.js |
| Language | TypeScript |
| Routing model | Next.js App Router |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Auth.js |
| Authorization | Application-owned two-role checks enforced server-side |
| Validation | Zod |
| Unit/integration testing | Vitest, used selectively |
| End-to-end testing | Playwright, focused on critical user flows |
| Package manager | pnpm |
| Node.js | 22, matching `.nvmrc` |
| CI | GitHub Actions for basic validation |
| Application hosting | Vercel |
| Managed PostgreSQL | Neon |

### Application Framework

Next.js with TypeScript is the recommended framework.

The main trade-off is that Next.js introduces more framework conventions than a small custom server, but it also provides routing, server rendering, forms/server actions or route handlers, production builds, and first-class deployment support in one package. For this MVP, that keeps the project small while still feeling like a complete web application.

The App Router should be used. It is the current primary routing model for modern Next.js applications and fits simple page-based Admin and Employee workflows.

### Styling

Tailwind CSS is recommended.

Plain CSS or CSS Modules would also be adequate for a small project, but Tailwind matches the repository's initial technology direction and helps build a clean portfolio UI without adding a component library. A design system or large UI framework is not needed for the MVP.

### Database

PostgreSQL is recommended for both local development and production.

For local development, the project should use a local PostgreSQL instance or a lightweight local container in a later implementation stage. For production, the project should use a managed PostgreSQL database.

The database schema is intentionally not defined in this stage.

### ORM

Prisma is recommended as the primary ORM.

Prisma and Drizzle both provide type-safe database access and good TypeScript support. Drizzle is lighter and keeps developers closer to SQL, which can be valuable, but Prisma has a gentler learning curve, a clear migration workflow, strong documentation, readable generated types, and common Next.js usage patterns.

For this small CRUD and attendance application, Prisma is the better fit because it favors clarity and approachability while still supporting maintainable migrations and typed data access.

### Authentication

Auth.js is recommended as the primary authentication solution.

Auth.js and Clerk can both support login for Admin and Employee users. Clerk provides a polished hosted user-management experience, but it adds a stronger external product dependency and can make the portfolio project feel more service-bound than necessary. Auth.js keeps authentication closer to the application, has lower operational weight for a simple MVP, and offers better learning value for understanding sessions, users, and server-side protection.

Architectural implication: Auth.js should identify the signed-in user, while the application database should own employee records, active/inactive status, and the Admin or Employee role used for authorization. The final user and employee relationship should be decided during the database and authentication stages, not here.

## Application Structure

When the application scaffold is created in a later stage, the intended structure should stay shallow and conventional.

Possible future structure:

```text
app/
components/
lib/
prisma/
tests/
```

Expected responsibilities:

- `app/` contains routes, layouts, server actions or route handlers, and page-level logic.
- `components/` contains reusable UI components.
- `lib/` contains shared helpers such as authentication utilities, authorization checks, validation schemas, date/time helpers, and database client setup.
- `prisma/` contains Prisma schema and migrations when the database stage begins.
- `tests/` contains focused automated tests when testing is introduced.

The MVP does not need repository classes, domain service layers, command buses, event buses, hexagonal architecture, or clean architecture boundaries. Small helper modules are enough until repeated complexity proves otherwise.

## Authentication and Authorization

The MVP has exactly two roles:

- Admin;
- Employee.

Authentication should answer: who is signed in?

Application authorization should answer: what is this signed-in user allowed to do?

Authorization must be enforced server-side. UI-level hiding can improve usability, but it must not be the security boundary.

Minimum authorization expectations:

- Admin users may manage employees and view attendance records for all employees.
- Employee users may create their own attendance activity and view only their own attendance history.
- Inactive employees must not be allowed to create new attendance activity.

No granular permission matrix, RBAC framework, policy engine, or additional role is recommended for the MVP.

## Data Access

All application data should live in PostgreSQL and be accessed through Prisma.

Data access should remain direct and simple:

- use Prisma from server-side application code;
- keep database writes behind server-side routes, server actions, or equivalent server-only handlers;
- validate inputs before writes;
- enforce ownership and role checks before returning protected data.

The database schema, indexes, constraints, and migrations belong to a later database foundation stage.

## Validation Strategy

Zod is recommended for lightweight schema validation.

Validation should be used for user-submitted inputs such as login form values, employee create/edit forms, and attendance actions. The goal is consistent input checking and clear error messages, not a large validation framework.

Database constraints should still enforce important invariants such as unique employee email addresses and employee numbers once the schema is defined.

## Testing Strategy

Testing should stay proportional to the MVP.

Vitest is recommended for focused unit or integration tests around high-value business behavior, such as attendance rule helpers, authorization helpers, validation schemas, and date/time utilities.

Playwright is recommended for a small number of end-to-end tests covering critical flows:

- Admin login and employee management basics;
- Employee login;
- check-in and check-out;
- access separation between Admin and Employee views.

Large test suites for trivial rendering or simple framework wiring are not recommended.

## CI Strategy

GitHub Actions should be used later for a simple validation workflow.

The eventual workflow should run only the checks that exist at that stage, such as:

- lint;
- typecheck;
- tests when relevant;
- build.

No workflow files should be created during Stage 2.

## Deployment Direction

Vercel is recommended for hosting the Next.js application.

Railway is also a practical option because it can host both the application and PostgreSQL, but Vercel has the simplest fit for a Next.js portfolio application and keeps deployment setup familiar for this stack.

Neon is recommended for managed PostgreSQL.

Neon provides a low-burden managed PostgreSQL direction that works well for small projects and learning use. Railway PostgreSQL is also viable, especially if the application were hosted on Railway, but the recommended production direction is:

- application on Vercel;
- PostgreSQL on Neon.

No deployment resources should be created during Stage 2.

## Environment Strategy

The MVP needs two environment categories:

- local development;
- production.

A separate staging environment is not required for the MVP unless a later deployment stage finds a clear need.

Expected future environment values may include database connection settings, Auth.js secrets, and provider-specific authentication values. Real credentials and `.env` files must not be committed.

Node.js 22 and pnpm remain appropriate and should not be changed based on current repository evidence.

## Deferred Decisions

The following open product requirements from `docs/MVP_SCOPE.md` are not resolved by this architecture stage:

| Decision | Owner stage |
| --- | --- |
| Timezone strategy for attendance timestamps | Database foundation or attendance workflow |
| Reference work start time for Late status | Attendance workflow |
| Which dates count as workdays for Absent status | Attendance workflow |
| How Admin marks Leave status without advanced leave approval | Attendance workflow |
| Minimum employee data fields | Employee management or database foundation |

These are business and data-model decisions. They should be decided explicitly when the related implementation stage has enough context.

## Stage 3 Handoff

Stage 3 should create the application foundation without expanding the MVP.

Recommended next steps:

- scaffold a Next.js TypeScript application using the App Router;
- configure pnpm and keep Node.js 22;
- add Tailwind CSS;
- add basic linting and formatting if included by the scaffold;
- do not add database schema, authentication, or attendance behavior until their stages.

The architecture for future implementation is:

- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- PostgreSQL;
- Prisma;
- Auth.js;
- Zod;
- Vitest and Playwright used selectively;
- GitHub Actions validation later;
- Vercel application hosting with Neon PostgreSQL.
