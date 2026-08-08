# Employee Attendance Data Model

## Purpose

Define the smallest practical relational data model for the Employee Attendance MVP. This document guides a later PostgreSQL + Prisma implementation stage, but does not define Prisma schema, SQL DDL, migrations, seed data, database connections, or application code.

## Modeling Decisions

- `User` and `Employee` are separate entities.
- `User` represents the authenticated application account and owns the `Admin` or `Employee` role used for server-side authorization.
- `Employee` represents the managed employee profile and owns attendance history.
- An Admin user may exist without an employee profile.
- An Employee user must be linked to exactly one employee profile before they can use employee attendance features.
- `User.employeeId` is the authoritative relationship between a login account and an employee profile.
- `User.email` and `Employee.email` are separate fields with separate responsibilities; email must never be used as the ownership relationship or relational join between `User` and `Employee`.
- Department is not included in the MVP data model because no approved capability requires filtering, grouping, or editing departments.
- Active/inactive employee lifecycle is represented with a simple boolean on `Employee`.
- Employee records are not hard-deleted in the MVP; they are deactivated to preserve attendance history.

## Entities

### User

Authentication identifies the signed-in user. The application stores the role needed for authorization and, for Employee users, the employee profile they belong to.

| Field | Type Concept | Required | Notes |
| --- | --- | --- | --- |
| id | UUID/string identifier | Yes | Primary identifier for the application user. |
| email | email/string | Yes | Unique authentication account identifier used by the authentication layer. For Employee-role users, this would normally correspond to `Employee.email`, but no database equality is defined. |
| role | enum | Yes | Allowed values: `Admin`, `Employee`. Belongs on `User`, not `Employee`, because authorization applies to the signed-in account. |
| employeeId | UUID/string identifier | No | Required by application validation when `role = Employee`; must be empty or optional for Admin users. Unique when present. |
| createdAt | timestamp | Yes | Record creation timestamp. |
| updatedAt | timestamp | Yes | Last update timestamp. |

### Employee

Employee stores the manageable employee data and remains the owner of attendance records.

| Field | Type Concept | Required | Notes |
| --- | --- | --- | --- |
| id | UUID/string identifier | Yes | Primary identifier for the employee profile. |
| employeeNumber | string | Yes | Unique business identifier shown and edited by Admin. |
| name | string | Yes | Minimum display name for employee list, editing, and attendance views. |
| email | email/string | Yes | Unique employee/profile business data managed as part of the employee record. Duplicate employee emails are not allowed. |
| isActive | boolean | Yes | `true` means the employee can create attendance activity; `false` means deactivated. Simpler than an employment-status enum for the MVP. |
| createdAt | timestamp | Yes | Record creation timestamp. |
| updatedAt | timestamp | Yes | Last update timestamp. |

Not included:

- `role`: role belongs to `User`.
- `department`: not required by approved MVP capabilities.
- broad employment status enum: the MVP only needs active/inactive.

### AttendanceRecord

AttendanceRecord stores one employee's attendance state for one business date.

| Field | Type Concept | Required | Notes |
| --- | --- | --- | --- |
| id | UUID/string identifier | Yes | Primary identifier for the attendance record. |
| employeeId | UUID/string identifier | Yes | Required link to exactly one employee. |
| attendanceDate | date | Yes | Business attendance date, stored separately from timestamps. |
| checkInAt | timestamp | No | Set once when an employee checks in. Empty for Leave records and any explicitly stored Absent record. |
| checkOutAt | timestamp | No | Set once when an employee checks out. Must not exist without `checkInAt`. |
| status | enum | Yes | Approved values: `Present`, `Late`, `Absent`, `Leave`. `Absent` is not automatically generated in the MVP until workday rules exist. |
| notes | string | No | Optional short note, mainly for Admin-entered Leave or future simple corrections. No audit or comment history. |
| createdAt | timestamp | Yes | Record creation timestamp. |
| updatedAt | timestamp | Yes | Last update timestamp. |

## Relationships

- Admin User may exist without an Employee profile.
- Employee-role User must reference exactly one Employee before employee functionality is available.
- An Employee can have zero or one User account.
- An Employee can have many AttendanceRecords.
- Each AttendanceRecord belongs to exactly one Employee.
- `User.employeeId` is optional and unique when present.
- `User.employeeId` is the authoritative link between login account and employee profile.
- Email must never be used as the ownership relationship or relational join between `User` and `Employee`.
- Any policy requiring `User.email` and `Employee.email` to remain synchronized belongs to application/authentication workflow validation in a later stage.

## Attendance Status Representation

`Present` and `Late` should be persisted on attendance records.

Reasoning:

- Simple attendance summaries can query status directly.
- Historical records remain stable if the Late threshold changes later.
- Stage 4B can enforce the allowed enum values without implementing Late-rule algorithms.

`Leave` is stored as an `AttendanceRecord` with `status = Leave`, no check-in/check-out timestamps, and an optional note. A separate leave request table is not needed because advanced leave approval is out of scope.

`Absent` should not be generated automatically or require stored rows in Stage 4A. In the current MVP, Absent means no check-in exists on a date that should count as a workday, but workday rules are unresolved and no scheduler exists. Therefore Absent is derived from expected workdays with no attendance record once workday rules are defined. If the product later chooses a manual Admin workflow, an explicit Absent row can use the existing `AttendanceRecord` entity and `Absent` status without adding entities.

## Date and Time Strategy

- `attendanceDate` is a business date used for one-record-per-employee-per-day rules.
- `checkInAt` and `checkOutAt` are timestamps representing actual events.
- Timestamps should be stored in UTC at the database level, with business timezone interpretation handled by application policy once the timezone decision is made.
- The model intentionally keeps business date and event timestamps separate so the timezone policy can be chosen later without redesigning entities.
- No business timezone is invented in this stage.

## Constraints and Integrity

Database-enforceable constraints:

- `User.email` is unique.
- `User.role` is limited to `Admin` or `Employee`.
- `User.employeeId` references `Employee.id`.
- `User.employeeId` is unique when present.
- `Employee.employeeNumber` is unique.
- `Employee.email` is unique.
- `AttendanceRecord.employeeId` references `Employee.id`.
- `AttendanceRecord.status` is limited to approved MVP statuses.
- `AttendanceRecord` has a unique combination of `employeeId` + `attendanceDate`.
- `checkOutAt` must not exist without `checkInAt`; this is a required database integrity rule, with the exact PostgreSQL/Prisma migration implementation to be determined in Stage 4B.

Application-level business validation:

- A user with `role = Employee` must be linked to an employee before using employee features.
- Admin users may exist without an employee profile.
- Inactive employees must not create new attendance activity.
- Check-in may happen at most once per attendance date.
- Check-out may happen at most once per attendance record.
- Check-out requires an existing check-in.
- Late status requires a future reference work start time.
- Absent status requires future workday rules.
- Leave creation requires a future Admin workflow decision, but not an approval workflow.

## Deactivation and Historical Data

Employees should not be hard-deleted in the MVP. Admins deactivate employees by setting `Employee.isActive = false`.

Attendance records remain linked to the employee profile for history, summaries, and auditability of past attendance. Deactivation only prevents new attendance activity; it does not remove historical records.

## Explicitly Rejected Entities

- `LeaveRequest`: advanced leave approval is out of scope; Leave can be represented by `AttendanceRecord`.
- `AuditLog`: no approved audit feature.
- `Department`: no approved department feature or required query.
- `Company`: multi-company tenancy is out of scope.
- `Shift`: complex shifts are out of scope.
- `WorkSchedule`: workday rules are unresolved and should not be invented in Stage 4A.
- `Permission` or `Role` table: the MVP has exactly two roles; a `User.role` enum is enough.
- `AttendanceEvent`: one attendance record per employee per attendance date is sufficient for one check-in and one check-out.
- `Notification`: real-time notifications are out of scope.
- `Payroll`: payroll is out of scope.

## Deferred Business Decisions

- Business timezone for attendance date interpretation.
- Reference work start time used to determine Late.
- Which dates count as workdays for Absent.
- Exact workflow for Admin marking Leave.
- Whether Absent remains derived only or can be manually stored by Admin after workday rules are defined.
- Exact Auth.js adapter tables and provider details.

## Stage 4B Handoff

Stage 4B should implement only these conceptual entities unless new repository evidence changes the scope:

- `User`
- `Employee`
- `AttendanceRecord`

Stage 4B should create the PostgreSQL/Prisma implementation, enum names, indexes, and migrations based on this document. It should not add rejected entities unless the MVP scope is explicitly changed first.
