# Employee Attendance MVP Scope

## Purpose

Employee Attendance is a simple web application for learning end-to-end application development, practicing human-governed Agentic Engineering, producing a working MVP, and creating a small portfolio-ready project.

The MVP should remain intentionally small and practical. It is not part of COALISTIX and must not introduce enterprise requirements unless they are explicitly required for the MVP.

## Actors

The MVP has exactly two actors:

1. Admin
2. Employee

No other roles are included in the MVP.

## MVP Features

### Admin

The Admin can:

- log in;
- view the employee list;
- add an employee;
- edit basic employee data;
- activate or deactivate an employee when needed for employee lifecycle;
- view attendance history for employees;
- view a simple attendance summary.

### Employee

The Employee can:

- log in;
- check in;
- check out;
- view today's attendance status;
- view personal attendance history.

## Attendance Statuses

The MVP supports these attendance statuses:

- Present
- Late
- Absent
- Leave

Status behavior should remain simple. Any unresolved status detail must be captured as an open requirement instead of being expanded into unsupported business logic.

## Minimum Business Rules

1. An employee can check in at most once for a given attendance date.
2. An employee cannot check out without first checking in.
3. An employee can check out at most once for a given attendance record.
4. Employee attendance history is visible only to that employee and authorized Admin users.
5. Admin users may view attendance records for all employees.
6. Inactive employees must not be able to create new attendance activity.
7. Duplicate employee email addresses must not be allowed.
8. Duplicate employee numbers must not be allowed.
9. Attendance timestamps must follow one explicit timezone strategy.
10. Late status requires a reference work start time.
11. Absent status means an employee has no check-in record for an attendance date that should count as a workday, subject to the open requirements below.
12. Leave status means an employee is marked as not expected to attend for an attendance date, without adding an advanced leave approval workflow.

## Out of Scope

The following are outside the MVP:

- face recognition;
- fingerprint integration;
- GPS anti-spoofing;
- payroll;
- complex shifts;
- multi-company tenancy;
- native mobile application;
- real-time notifications;
- AI prediction;
- advanced leave approval workflow;
- biometric authentication;
- complex reporting;
- microservices;
- Kubernetes;
- event-driven architecture.

## Acceptance Criteria

The MVP scope is acceptable when:

- exactly two actors are defined: Admin and Employee;
- all approved Admin and Employee capabilities are included;
- the supported attendance statuses are Present, Late, Absent, and Leave;
- all explicit out-of-scope items are preserved;
- no feature outside the approved MVP is introduced;
- minimum business rules are clear enough to support Stage 2 architecture work;
- unresolved requirements are listed openly rather than guessed;
- no database schema is defined;
- no ORM is selected;
- no authentication provider is selected;
- no hosting or deployment provider is selected;
- no UI design is defined;
- the scope remains concise and practical.

## Open Requirements

The following details must be decided before or during later stages:

- The approved timezone strategy for attendance timestamps.
- The reference work start time used to determine Late status.
- Which dates count as workdays for Absent status.
- How Admin marks Leave status in the MVP without introducing an advanced leave approval workflow.
- The minimum employee data fields required for adding and editing employees.

## Stage Boundary

Stage 1 defines the MVP product scope only.

It does not define architecture, database schema, API contracts, UI design, authentication provider, ORM, hosting provider, deployment provider, or implementation tasks. Those decisions belong to later stages.
