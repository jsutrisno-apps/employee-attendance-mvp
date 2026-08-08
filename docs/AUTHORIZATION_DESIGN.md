# Employee Attendance Authentication & Authorization Design

## Purpose

This document defines the Stage 5A implementation contract for authentication and authorization in the Employee Attendance MVP.

It is design-only. Stage 5A does not add dependencies, routes, middleware, UI, credentials, sessions, database migrations, or application code.

The MVP has exactly two roles:

- Admin
- Employee

No granular permission system, policy engine, OAuth provider, SSO, MFA, biometric login, password reset flow, or account lockout system is included in the MVP.

## Authentication Strategy

Use Auth.js with a credentials-based login for the MVP.

The login form should collect:

- email
- password

This is the smallest suitable strategy for the current project because it supports Admin and Employee login, works well in local development, avoids external email-delivery or hosted identity dependencies, is easy to seed and test for a portfolio demo, and keeps authentication close to the application for learning value.

Magic-link authentication is not the primary strategy because it requires reliable email delivery even for local development and testing. Social login and enterprise identity providers are outside the approved MVP.

Passwords must never be stored in plaintext. Stage 5B should add a secure password hash field to the application-owned `User` model and compare submitted passwords against that hash on the server.

Minimum password handling requirements for Stage 5B:

- store only a password hash, never the submitted password;
- hash passwords with a current password hashing library suitable for server-side password storage;
- perform password verification only on the server;
- use generic authentication failure messages where practical;
- keep Auth.js secrets and any authentication configuration secrets in environment variables.

## Login Identity

Login must use `User.email`.

`Employee.email` is employee/profile business data managed as part of employee records. It must not be used to authenticate a user, resolve account ownership, or infer the relationship between a signed-in account and an employee profile.

`User.employeeId` remains the authoritative relationship between an Employee-role user account and the employee profile it owns.

For Employee users, `User.email` may normally match `Employee.email` as a product convention, but authorization must not rely on email equality.

## User and Employee Relationship

The existing Prisma model separates application accounts from employee profiles:

- `User` represents the authenticated application account.
- `User.role` owns the `Admin` or `Employee` authorization role.
- `User.employeeId` links an Employee-role account to exactly one `Employee` profile when employee features are used.
- `Employee` owns employee lifecycle data and attendance history.
- `Employee.isActive` controls whether new attendance activity is allowed.

Admin users may exist without an employee profile.

Employee-role users must have a valid `employeeId` relationship before using employee functionality.

## Auth.js Integration

Use the current Auth.js App Router integration direction in Stage 5B.

As of Stage 5A verification, current Auth.js documentation shows a root-level `auth.ts` configuration that exports helpers such as `auth`, `handlers`, `signIn`, and `signOut`, with route handlers wired through `app/api/auth/[...nextauth]/route.ts`. Stage 5B should re-check the official Auth.js documentation before implementation to confirm the exact package versions, Next.js 16 compatibility, and any current runtime guidance.

Use the Credentials provider to resolve a submitted email and password to the existing application-owned `User` record.

Do not automatically introduce the full Auth.js adapter schema. The MVP does not need Auth.js `Account`, `Session`, or `VerificationToken` tables for the selected credentials plus JWT session design.

Auth.js should identify the signed-in user. Application code remains responsible for role checks, employee ownership checks, and inactive employee enforcement.

## Session Strategy

Use JWT-backed Auth.js sessions.

JWT sessions are the primary strategy for this MVP because they avoid additional session tables, keep Stage 5B database changes minimal, and are sufficient for a two-role application with server-side authorization checks.

Trade-offs:

- JWT sessions are simpler to implement and deploy for this MVP.
- Database-backed sessions can support more direct server-side revocation, but require additional tables and implementation overhead that the MVP does not currently need.
- Authorization-sensitive behavior must still revalidate important database state, especially employee linkage and `Employee.isActive`.

## Session Contents

The session should expose only the minimum data server-side code needs:

- `userId`
- `role`
- `employeeId`

`userId` and `role` may be copied from `User` into JWT/session claims after successful authentication.

`employeeId` may be copied into the session for routing and basic ownership checks, but database-changing employee operations must not trust client input for `employeeId`.

Do not put unnecessary employee profile data, attendance data, or broad authorization state into the session.

Authorization-sensitive operations should re-read current database state when needed:

- verify that the user still exists;
- verify the current `User.role` if the operation depends on role;
- verify `User.employeeId` for Employee-only operations;
- verify `Employee.isActive` before creating new attendance activity.

## Inactive Employee Policy

Inactive employees should be blocked from signing in.

For the MVP, this is simpler and safer than allowing authentication but blocking selected employee actions. It gives clear deactivation semantics: an inactive Employee account cannot start a new session and therefore cannot create new attendance activity.

Stage 5B behavior:

- Admin users are not blocked by `Employee.isActive` because they may not have an employee profile.
- Employee-role users must have a linked employee profile.
- If the linked employee profile is inactive, authentication fails.
- If an employee is deactivated after a session already exists, server-side employee business actions must re-check `Employee.isActive` and block new attendance activity.

Historical attendance remains preserved through the employee profile. Deactivation must not delete employee or attendance records.

## Route Boundaries

Define only these conceptual route groups for Stage 5B and later feature stages:

Public:

- login page
- Auth.js endpoints required by the selected integration

Admin-only:

- employee management
- all-employee attendance history
- all-employee dashboard or summary

Employee-only:

- check-in
- check-out
- today's attendance status
- personal attendance history

No additional route groups are required for the MVP.

## Authorization Enforcement

Authorization must be enforced server-side. UI hiding is useful for experience but is not a security boundary.

Stage 5B should introduce a small set of reusable server-side helpers or equivalent patterns:

- `requireUser()` for authenticated access;
- `requireAdmin()` for Admin-only access;
- `requireEmployee()` for Employee-only access with a valid `employeeId`;
- an employee activity check that verifies `Employee.isActive` before attendance writes.

These helpers should be used in protected pages/layouts, server actions, route handlers, and any database-changing operation.

Do not duplicate role logic across every page or action. Do not create a permission matrix or policy engine.

Server-side code must not trust role, `userId`, or `employeeId` from form input, query parameters, or other client-controlled data.

## Next.js Protection Strategy

Use server-side checks close to protected data and protected operations.

For Stage 5B, the preferred protection shape is:

- server components and protected layouts call authentication/authorization helpers before rendering protected content;
- server actions perform authorization before validation-dependent writes;
- route handlers perform authorization before returning protected data or mutating data;
- middleware/proxy may be used later for coarse redirects if current Next.js and Auth.js guidance recommends it, but it must not be the sole security boundary.

This keeps authorization readable and close to the code that reads or writes protected data.

## Login and Logout Behavior

Login flow:

1. User submits `User.email` and password.
2. Auth.js Credentials authentication validates the account on the server.
3. The submitted email resolves to an application `User`.
4. The password is verified against `User.passwordHash`.
5. The user's role and employee relationship are validated.
6. Employee-role users are rejected if they lack a linked employee profile or the linked employee is inactive.
7. A JWT-backed session is established.
8. The user is redirected to the role-appropriate area.

Role-appropriate redirects:

- Admin users go to the Admin area.
- Employee users go to the Employee area.

Logout flow:

1. The current Auth.js session is terminated.
2. The user returns to the login or public page.

## Failure Behavior

Keep failure behavior simple and avoid revealing account existence when practical.

Minimum failures:

- Invalid credentials or unknown account: show a generic login failure.
- Inactive employee: block sign-in; the message may say the account cannot be used, without exposing unnecessary account detail.
- Employee user without a linked employee profile: block sign-in or employee access until the account is fixed.
- Unauthenticated access to protected routes: redirect to login or return an unauthorized response for non-page handlers.
- Authenticated user accessing the wrong role area: deny access or redirect to the correct role area.

Do not add lockout infrastructure, CAPTCHA, password reset, account recovery, MFA, or security event logging unless a later approved stage adds those requirements.

## Database Change Assessment

Stage 5B requires one minimal Prisma model change if credentials authentication is implemented:

- add `passwordHash` to `User`.

Reason:

- the selected authentication strategy requires server-side password verification;
- the current `User` model has no field for storing a password hash;
- plaintext passwords are not allowed.

Do not add Auth.js adapter tables for `Account`, `Session`, or `VerificationToken` unless Stage 5B verification proves they are required by the final Auth.js configuration.

Do not redesign the existing `User`, `Employee`, or `AttendanceRecord` entities.

## Security Baseline

Stage 5B must preserve these requirements:

- authorization is enforced server-side;
- passwords are stored only as secure hashes;
- plaintext passwords are never stored;
- roles are read from the server-side `User` record or trusted session claims created by the server;
- role, `userId`, and `employeeId` are never trusted from client input;
- inactive employees cannot sign in and cannot create new attendance activity;
- session and Auth.js secrets are stored in environment variables;
- authentication failure messages are generic where practical.

## Stage 5B Handoff

Stage 5B should implement the smallest version of this design:

- install and configure Auth.js for the current Next.js App Router version;
- add the minimal `User.passwordHash` migration;
- choose and install a server-side password hashing library;
- wire Credentials authentication to the existing `User` model;
- use JWT-backed sessions;
- propagate `userId`, `role`, and `employeeId` into server-side session data;
- create small server-side authorization helpers;
- add public login/logout behavior;
- protect Admin and Employee route boundaries;
- block inactive Employee users at sign-in and before attendance writes;
- validate the implementation with focused checks before moving to feature stages.

Stage 5B should re-check current official Auth.js and Next.js guidance immediately before implementation, especially around package names, exported helper shape, route handler wiring, and middleware/proxy recommendations.
