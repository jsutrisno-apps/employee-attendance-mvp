# Employee Attendance Business Rules

## Purpose

This document resolves the minimum attendance business rules required for the Stage 7B core Employee attendance transaction. It is the implementation contract for check-in, check-out, today's attendance status, and the related time policy.

Stage 7A does not change source code, Prisma schema, migrations, dependencies, or runtime behavior.

## Business Timezone

The MVP business timezone is `Asia/Jakarta`.

Use `Asia/Jakarta` to determine:

- the business calendar date for attendance;
- today's attendance record;
- whether a check-in belongs to the current business date;
- the Present or Late status at check-in.

Do not use UTC, server-local time, browser/device time, or per-user timezones as the business timezone.

`checkInAt` and `checkOutAt` remain actual event timestamps stored as PostgreSQL `TIMESTAMPTZ`, compatible with UTC timestamp storage. Timezone policy is applied by server-side application logic when interpreting those instants as business dates and local business times.

## Business Date

`attendanceDate` is the calendar date in `Asia/Jakarta` at the moment attendance activity occurs. It is stored separately from `checkInAt` and `checkOutAt`.

Example:

- Actual instant: `2026-08-09T17:30:00Z`
- Jakarta local time: `2026-08-10 00:30`
- `attendanceDate`: `2026-08-10`

The `attendanceDate` is not `2026-08-09` in this example, because the business date is based on Jakarta local calendar date, not UTC calendar date.

## Work Start Time

The MVP work start time is `08:00:00` in `Asia/Jakarta`.

This is a business policy constant. Do not introduce employee-specific start times, shifts, flexible schedules, configurable schedules, Admin schedule configuration, or a database entity for work start time in Stage 7B unless a later approved stage changes the scope.

## Workday Policy

The MVP workday policy is:

- Monday through Friday are workdays.
- Saturday and Sunday are non-workdays.

Public holidays, company holidays, employee-specific schedules, shift calendars, roster tables, and holiday APIs are not modeled in this MVP.

This workday policy also governs normal Employee check-in. Employee check-in is allowed only Monday through Friday. Saturday and Sunday check-in requests must be rejected.

Do not create weekend overtime, special attendance, shift, or exception logic. Weekends are also never derived as `Absent`.

## Attendance Status Rules

### Present

An attendance record is `Present` when an active Employee checks in at or before `08:00:00` on the current `Asia/Jakarta` business date.

Boundary examples:

- `07:59:59` -> `Present`
- `08:00:00` -> `Present`

### Late

An attendance record is `Late` when an active Employee checks in after `08:00:00` on the current `Asia/Jakarta` business date.

Boundary example:

- `08:00:01` -> `Late`

Do not add a grace period in the MVP.

### Absent

Do not create automatic `Absent` rows. Do not add cron, scheduler, background jobs, or midnight processing for Absent status in Stage 7B.

For the MVP, `Absent` is derived. An Employee is considered `Absent` for a date when all of the following are true:

- the date is Monday-Friday under the MVP workday policy;
- the date is before the current business date in `Asia/Jakarta`;
- no `AttendanceRecord` exists for that Employee and date.

The current business date must not be reported as `Absent` merely because the Employee has not checked in yet. Future dates, Saturdays, and Sundays must not be reported as `Absent`.

The existing Prisma `Absent` enum value remains valid, but Stage 7B does not need to materialize derived Absent records in PostgreSQL.

### Leave

`Leave` means an Employee is marked as not expected to attend for a specific attendance date.

Represent Leave with the existing `AttendanceRecord` model:

- `status = Leave`
- `checkInAt = null`
- `checkOutAt = null`
- `notes = optional`

An Admin may mark an Employee as Leave for a specific attendance date, but Stage 7B should not expand into a leave-management module unless that work is explicitly authorized. Do not create `LeaveRequest`, `LeaveApproval`, `LeaveType`, or other leave entities.

## Check-In Rules

An Employee may check in only when:

- authenticated as an Employee user;
- linked to an Employee profile through `User.employeeId`;
- the linked Employee is active;
- the current `Asia/Jakarta` business date is Monday through Friday.

Reuse the existing server-side authorization foundation for these account, role, employee profile, and active-state checks.

At check-in, the server must:

1. Determine the current instant on the server.
2. Interpret that instant in `Asia/Jakarta`.
3. Derive `attendanceDate` from the Jakarta business calendar date.
4. Determine `Present` or `Late` using the `08:00:00` Jakarta threshold.
5. Create exactly one `AttendanceRecord`.

The created record must set:

- `employeeId` to the authenticated Employee profile;
- `attendanceDate` to the Jakarta business date;
- `checkInAt` to the current actual timestamp;
- `checkOutAt = null`;
- `status = Present` or `Late`.

The browser must not provide authoritative `employeeId`, `attendanceDate`, `checkInAt`, or `status` values. These values must be derived server-side.

If today's `AttendanceRecord` already exists, reject another check-in. The existing unique constraint on `(employeeId, attendanceDate)` remains the final concurrency and integrity protection; Stage 7B must not rely only on a pre-query.

## Check-Out Rules

Check-out operates on the authenticated Employee's current `Asia/Jakarta` business-date `AttendanceRecord`.

An Employee may check out only when:

- today's record exists;
- `checkInAt` exists;
- `checkOutAt` is null.

At successful check-out, set:

- `checkOutAt` to the current actual timestamp.

Normal check-out must not change:

- `attendanceDate`;
- `checkInAt`;
- `status`.

Reject check-out when no current business-date attendance record exists. Reject duplicate check-out when `checkOutAt` already exists.

The database check constraint `attendance_records_check_out_requires_check_in` remains authoritative protection that checkout cannot exist without check-in.

The MVP supports same-business-date attendance only. Normal check-in and check-out belong to the same `Asia/Jakarta` business date.

Stage 7B must resolve check-out against the authenticated Employee's `AttendanceRecord` for the current Jakarta business date. If an Employee checked in on a previous business date but attempts to check out after the Jakarta date has changed, normal Stage 7B checkout must not silently modify the previous record.

Cross-midnight and cross-business-date attendance are unsupported in the MVP. Do not introduce night shifts, overnight shifts, automatic rollover, previous-day record recovery, or correction workflows. Any future correction capability requires separate approval.

## Existing Record Collision Rules

Employee check-in must not overwrite any existing attendance record for the authenticated Employee and current business date.

If today's existing record has `status = Leave`, reject check-in. Do not silently convert Leave into Present or Late.

Future Admin correction behavior is a separate capability and must not be invented in Stage 7B.

## Server Authority

Attendance state transitions are server-authoritative.

The browser may request:

- check in;
- check out.

The browser must not determine authoritative:

- `employeeId`;
- `attendanceDate`;
- timestamp;
- `Present` or `Late` status;
- role;
- active state.

Server-side implementation must derive these from the authenticated session, current database state, server-side current time, and this business policy.

## Date and Time Examples

Business timezone conversion:

- `2026-08-09T17:30:00Z` is `2026-08-10 00:30` in Jakarta.
- The attendance date is `2026-08-10`.

Present/Late boundary:

- `2026-08-10 07:59:59 Asia/Jakarta` -> `Present`
- `2026-08-10 08:00:00 Asia/Jakarta` -> `Present`
- `2026-08-10 08:00:01 Asia/Jakarta` -> `Late`

Status stability:

- Check in at `07:55` -> `Present`; check out at `17:00`; status remains `Present`.
- Check in at `08:10` -> `Late`; check out at `17:00`; status remains `Late`.

## Stage 7B Implementation Contract

Recommended Stage 7B minimum scope:

- Employee opens the Employee area.
- Employee sees today's attendance status.
- Employee can check in.
- Employee can check out.
- Employee sees check-in time.
- Employee sees check-out time.

Stage 7B should first validate the core Employee attendance transaction before adding broader attendance history, Admin attendance visibility, Leave UI, or derived Absent history.

For Stage 7B implementation, first evaluate whether standard platform APIs such as `Intl.DateTimeFormat` are sufficient for the narrow `Asia/Jakarta` conversion. Do not add `date-fns`, `date-fns-tz`, Luxon, Moment, Day.js, or another timezone/date dependency without implementation evidence showing it is needed.

Recommended Stage 7 decomposition:

- Stage 7A: Attendance Business Rules & Time Policy
- Stage 7B: Core Employee Attendance Transaction
- Stage 7C: Attendance History & Derived Statuses
- Stage 7D: Admin Attendance Visibility / Simple Summary

## Deferred Capabilities

The following approved MVP capabilities remain deferred until later controlled stages:

- personal attendance history;
- Admin attendance history;
- Admin simple attendance summary;
- Leave UI or Admin Leave marking workflow;
- derived Absent history display;
- Admin correction behavior.

## Explicit Non-Goals

Do not implement or design these in Stage 7B:

- shifts;
- grace period;
- overtime;
- break tracking;
- multiple check-ins;
- multiple check-outs;
- geolocation;
- GPS;
- biometrics;
- face recognition;
- device restrictions;
- IP restrictions;
- QR attendance;
- holiday API;
- public holiday database;
- scheduler;
- cron;
- notifications;
- payroll;
- timesheets;
- attendance corrections;
- approval workflow;
- manager approval;
- complex reporting.
