# SkillUp Africa — Backend Microservices

> A production-grade microservice platform delivering tech education to secondary schools across Nigeria. Built on NestJS, TypeORM, PostgreSQL, and JWT — with a clean API Gateway pattern and TCP transport between services.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Services](#services)
  - [API Gateway](#api-gateway)
  - [Auth Service](#auth-service)
  - [School Service](#school-service)
- [Authentication Flow](#authentication-flow)
- [Security Design](#security-design)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)

---

## Architecture Overview

```
Client (Postman / Web / Mobile)
          │
          │  HTTP (port 3000)
          ▼
┌─────────────────────────────────┐
│           API Gateway            │
│                                 │
│  • ValidationPipe               │
│  • JwtAuthGuard                 │
│  • RolesGuard                   │
│  • RpcExceptionFilter           │
└────────────┬────────────────────┘
             │
             │  TCP Transport
             │
    ┌────────▼────────┐     ┌─────────────────┐
    │   Auth Service   │     │  School Service  │
    │   (port 3001)   │     │   (port 3002)   │
    │                 │     │                 │
    │  • Register     │     │  • Schools      │
    │  • Verify Email │     │  • School Admins│
    │  • Login        │     │  • Students     │
    │  • Refresh      │     │  • Suspensions  │
    │  • Logout       │     │  • Deactivation │
    │  • Managed User │     │                 │
    └────────┬────────┘     └────────┬────────┘
             │                       │
             │  TypeORM              │  TypeORM
             ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │   PostgreSQL    │     │   PostgreSQL    │
    │  skillup_auth   │     │  skillup_school │
    └─────────────────┘     └─────────────────┘
```

### Coming Services

```
API Gateway
  ├──→ Payment-Service     (port 3003) → PostgreSQL (skillup_payment)
  ├──→ Onboarding-Service  (port 3004) → BullMQ + Redis
  ├──→ Learning-Service    (port 3005)
  └──→ Notification-Service(port 3006)
```

### Why This Architecture

| Concern          | Decision                  | Reason                                                                |
| ---------------- | ------------------------- | --------------------------------------------------------------------- |
| Transport        | TCP                       | Internal services are never exposed to the public internet            |
| Entry point      | Single API Gateway        | One place for all auth, validation, and access control                |
| Error handling   | RpcExceptionFilter        | TCP exceptions are translated to proper HTTP responses at the gateway |
| Token storage    | Hashed in DB              | Refresh tokens are bcrypt-hashed — a DB leak exposes nothing usable   |
| Atomicity        | Compensating transactions | If a gateway orchestration step fails, prior steps are rolled back    |
| Role enforcement | Gateway layer             | Role checks happen before any service is called                       |

---

## Project Structure

```
skillupAfrica/
├── apps/
│   ├── api-gateway/                        # Public HTTP entry point (port 3000)
│   │   └── src/
│   │       ├── auth/
│   │       │   ├── auth.controller.ts      # HTTP routes → TCP forwarding
│   │       │   ├── auth.module.ts          # Gateway auth module
│   │       │   ├── jwt.strategy.ts         # Passport JWT strategy
│   │       │   ├── jwt-auth.guard.ts       # Authentication guard
│   │       │   ├── roles.guard.ts          # Authorization guard
│   │       │   ├── roles.decorator.ts      # @Roles() decorator
│   │       │   └── rpc-exception.filter.ts # TCP → HTTP error translation
│   │       ├── school/
│   │       │   ├── dto/
│   │       │   │   ├── create-school-admin-request.dto.ts
│   │       │   │   └── create-student-request.dto.ts
│   │       │   ├── school.controller.ts    # School HTTP routes
│   │       │   └── school.module.ts
│   │       ├── api-gateway.module.ts
│   │       └── main.ts                     # HTTP server, port 3000
│   │
│   ├── auth-service/                       # Internal TCP microservice (port 3001)
│   │   └── src/
│   │       ├── auth/
│   │       │   ├── dto/
│   │       │   │   ├── create-user.dto.ts
│   │       │   │   ├── create-managed-user.dto.ts
│   │       │   │   ├── login.dto.ts
│   │       │   │   ├── tokenVerification.dto.ts
│   │       │   │   ├── resendEmailToken.dto.ts
│   │       │   │   ├── refreshToken.dto.ts
│   │       │   │   └── logout.dto.ts
│   │       │   ├── enums/
│   │       │   │   └── user-role.enum.ts
│   │       │   ├── auth.controller.ts      # @MessagePattern handlers
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.service.ts         # All business logic
│   │       │   └── user.entity.ts          # PostgreSQL users table
│   │       ├── email-service/
│   │       │   ├── email.module.ts
│   │       │   └── email.service.ts        # Nodemailer / Gmail
│   │       ├── auth-service.module.ts
│   │       └── main.ts                     # TCP server, port 3001
│   │
│   └── school-service/                     # Internal TCP microservice (port 3002)
│       └── src/
│           ├── school/
│           │   ├── dto/
│           │   │   ├── create-school.dto.ts
│           │   │   ├── create-school-admin.dto.ts
│           │   │   ├── create-student.dto.ts
│           │   │   ├── update-school.dto.ts
│           │   │   └── suspend-student.dto.ts
│           │   ├── entities/
│           │   │   ├── school.entity.ts
│           │   │   ├── school-admin.entity.ts
│           │   │   └── student.entity.ts
│           │   ├── enums/
│           │   │   └── payment-status.enum.ts
│           │   ├── school.controller.ts    # @MessagePattern handlers
│           │   ├── school.module.ts
│           │   └── school.service.ts       # All business logic
│           ├── school-service.module.ts
│           └── main.ts                     # TCP server, port 3002
│
├── node_modules/
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
└── .env
```

---

## Services

### API Gateway

**Port:** `3000` | **Transport:** HTTP | **Role:** Public entry point and orchestrator

The gateway is a thin proxy and orchestrator. Business logic lives in microservices — the gateway handles validation, authentication, authorization, and multi-service orchestration.

**Responsibilities:**

- Validate all incoming request bodies via `ValidationPipe`
- Authenticate requests via `JwtAuthGuard` on protected routes
- Enforce role-based access via `RolesGuard` and `@Roles()` decorator
- Forward requests to microservices via `ClientProxy`
- Translate TCP errors to HTTP responses via `RpcExceptionFilter`
- Orchestrate multi-service flows (e.g. create auth user + create student record atomically)
- Execute compensating transactions on partial failure

**Gateway Orchestration Pattern:**

```typescript
// Step 1 — validate school exists first (cheap check before creating user)
const school = await firstValueFrom(
  this.schoolClient.send('school.search-school-by-email', { email }),
);

// Step 2 — create auth identity
const user = await firstValueFrom(
  this.authClient.send('auth.create-managed-user', { ...userData }),
);

try {
  // Step 3 — create school record
  return await firstValueFrom(
    this.schoolClient.send('school.create-admin', { userId, schoolId }),
  );
} catch (error) {
  // Compensating transaction — roll back auth user if school step fails
  await firstValueFrom(
    this.authClient.send('auth.delete-user-by-id', { id: user.userId }),
  );
  throw error;
}
```

---

### Auth Service

**Port:** `3001` | **Transport:** TCP | **Role:** Identity and session management

Internal only — not reachable from outside. All communication goes through the gateway over TCP using message patterns.

**Entities:** `User`

| Field             | Type           | Notes                                         |
| ----------------- | -------------- | --------------------------------------------- |
| id                | uuid           | Primary key                                   |
| name              | string         | Full name                                     |
| email             | string \| null | Nullable — students may have no email         |
| password          | string         | bcrypt hashed                                 |
| role              | enum           | ADMIN, SCHOOL_ADMIN, STUDENT, TEACHER         |
| username          | string \| null | Unique, system-generated for managed users    |
| isVerified        | boolean        | Must be true to login                         |
| isActive          | boolean        | False blocks all login                        |
| mustResetPassword | boolean        | Forced reset on first login for managed users |
| refreshToken      | string \| null | bcrypt hash of raw token                      |

**Message Patterns:**

| Pattern                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `auth.register`            | Self registration with email verification      |
| `auth.verify-email`        | 4-digit token verification                     |
| `auth.resend-verification` | Resend expired token                           |
| `auth.login`               | bcrypt compare, JWT issuance                   |
| `auth.refresh-tokens`      | Verify JWT, issue new access token             |
| `auth.logout`              | Null refresh token hash                        |
| `auth.create-managed-user` | Skip verification, generate temp password      |
| `auth.reset-password`      | Force reset on first login                     |
| `auth.delete-user-by-id`   | Compensating transaction — rollback on failure |
| `auth.deactivate-user`     | Deactivate user account                        |
| `auth.search-user-by-id`   | Fetch user by ID                               |

---

### School Service

**Port:** `3002` | **Transport:** TCP | **Role:** School, admin, and student management

Internal only. Manages the full lifecycle of schools, school admins, and students. Does not handle authentication — identity is managed by the auth service.

**Entities:**

`School`

| Field                   | Type              | Notes                                       |
| ----------------------- | ----------------- | ------------------------------------------- |
| id                      | uuid              | Primary key                                 |
| name                    | string            | Unique                                      |
| email                   | string            | Unique — used for school lookup             |
| address                 | string            |                                             |
| phone                   | string            |                                             |
| max_students            | number            | Capacity limit enforced on student creation |
| price_per_student       | decimal           | Monthly billing rate                        |
| payment_status          | enum              | ACTIVE, SUSPENDED, PENDING                  |
| is_active               | boolean           | Platform admin controls activation          |
| reason_for_deactivation | string \| null    | Required on deactivation                    |
| deactivated_until       | timestamp \| null | Optional reactivation date                  |

`SchoolAdmin`

| Field   | Type   | Notes                                |
| ------- | ------ | ------------------------------------ |
| id      | uuid   | Primary key                          |
| user_id | string | References auth-service user (no FK) |
| school  | School | ManyToOne relation                   |

`Student`

| Field                 | Type              | Notes                                            |
| --------------------- | ----------------- | ------------------------------------------------ |
| id                    | uuid              | Primary key                                      |
| user_id               | string            | References auth-service user (no FK)             |
| username              | string            | System-generated (firstname + lastname + nanoid) |
| school                | School            | ManyToOne relation                               |
| is_suspended          | boolean           | Blocks learning access                           |
| reason_for_suspension | string \| null    |                                                  |
| suspension_start_date | timestamp \| null |                                                  |
| suspension_end_date   | timestamp \| null |                                                  |
| is_active             | boolean           | Soft delete / withdrawal                         |
| parent_phone          | string \| null    | Optional                                         |
| student_reg_no        | string \| null    | Optional — not all schools assign one            |

**Message Patterns:**

| Pattern                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| `school.create-school`          | Create a new school                                             |
| `school.create-admin`           | Assign a school admin record                                    |
| `school.create-student`         | Create a student record                                         |
| `school.search-school-by-email` | Look up school by email (used in gateway orchestration)         |
| `school.get-admin-by-id`        | Get school admin by user ID (used to resolve schoolId from JWT) |
| `school.all-schools`            | Get all active schools                                          |
| `school.school-details`         | Get school with admins and students                             |
| `school.school-admins`          | Get all school admins                                           |
| `school.get-students`           | Get students by school                                          |
| `school.get-student`            | Get student details with school                                 |
| `school.suspend-student`        | Suspend a student                                               |
| `school.reactivate-student`     | Lift suspension                                                 |
| `school.deactivate-school`      | Deactivate school with reason                                   |
| `school.reactivate-school`      | Reactivate school                                               |
| `school.delete-school`          | Delete school (blocked if admins or students exist)             |
| `school.delete-student`         | Delete student record                                           |
| `school.delete-school-admin`    | Delete school admin record                                      |
| `school.update-school`          | Update school fields                                            |

---

## Authentication Flow

### Registration and Verification

```
1. POST /auth/register
   Client sends { name, email, password }
   Auth-service hashes password, generates 4-digit token, saves user
   Nodemailer sends token to email
   Returns { status: 'Success', message: 'Please confirm your email' }

2. POST /auth/verify-email
   Client sends { token: "xxxx" }
   Auth-service finds user by token, checks expiry
   Sets isVerified: true, clears token from DB
   Returns { status: 'Success', message: 'User is verified' }
```

### Login and Token Flow

```
3. POST /auth/login
   Client sends { email, password }
   Auth-service checks isVerified and isActive (fail fast)
   bcrypt.compare(password, hashedPassword)
   Generates access token (15m) and refresh token (7d)
   Stores bcrypt hash of refresh token in DB
   Returns { accessToken, refreshToken }

4. POST /auth/refresh-tokens
   Client sends { refreshToken }
   Auth-service verifies JWT signature
   Fetches user, checks isActive and isVerified
   bcrypt.compare(rawToken, storedHash)
   Returns { accessToken }

5. POST /auth/logout  ← protected
   Client sends Bearer token in Authorization header
   Gateway JwtAuthGuard verifies token, extracts user.id
   Sends user.id to auth-service over TCP
   Auth-service nulls the refresh token hash in DB
   Returns { status: 'Success', message: 'Logged out successfully' }
```

### Managed User Flow (School Admin and Student Creation)

```
Platform Admin creates School Admin:
POST /school/create-school-admin
  { name, email, phone, schoolEmail }
       ↓
1. Gateway looks up school by schoolEmail → gets schoolId
2. Gateway calls auth.create-managed-user (role: SCHOOL_ADMIN) → gets userId
3. Gateway calls school.create-admin { userId, schoolId }
4. On failure at step 3 → auth.delete-user-by-id (compensating transaction)

School Admin creates Student:
POST /school/create-student
  { name, email?, parent_phone?, student_reg_no? }
       ↓
1. Gateway extracts userId from JWT
2. Gateway calls school.get-admin-by-id → resolves schoolId from admin profile
3. Gateway generates username: firstname + lastname + nanoid(6)
4. Gateway calls auth.create-managed-user (role: STUDENT) → gets userId
5. Gateway calls school.create-student { userId, schoolId, username, ... }
6. On failure at step 5 → auth.delete-user-by-id (compensating transaction)
```

---

## Security Design

### Password and Token Hashing

```typescript
// passwords
const encryptedPassword = await bcrypt.hash(password, 10);

// refresh tokens — raw token goes to client, hash goes to DB
user.refreshToken = await bcrypt.hash(refreshToken, 10);

// verification — bcrypt.compare(rawFromClient, hashFromDB)
await bcrypt.compare(refreshToken, user.refreshToken);
```

A database breach exposes neither passwords nor valid refresh tokens.

### JWT Payload

```typescript
interface JwtPayload {
  id: string;
  role: UserRole;
}
```

Minimum viable payload. No sensitive data. Identity comes from the verified token — never from the request body.

### Login Security

```typescript
// 1. check user exists
// 2. check isVerified and isActive  ← cheap DB field checks first
// 3. bcrypt.compare()               ← expensive CPU operation last
```

Fail fast on cheap checks before burning CPU cycles on bcrypt.

### Error Messages

Identical messages for wrong email and wrong password — an attacker cannot determine whether an email exists in the system.

### Role-Based Access Control

```typescript
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  SCHOOL_ADMIN = 'school_admin',
  ADMIN = 'admin',
}
```

- Students are created by school admins — no self-registration
- School admins are created by platform admins — no self-registration
- Role is always hardcoded at the gateway — never trusted from the client
- `schoolId` for school admin operations is always resolved from JWT — never from the request body

### Cross-Service References

School-service stores `user_id` as a plain column with no foreign key to auth-service. Services are independently deployable — no cross-database foreign keys.

---

## API Reference

### Auth Routes

#### Public

| Method | Route                       | Body                        | Description                        |
| ------ | --------------------------- | --------------------------- | ---------------------------------- |
| POST   | `/auth/register`            | `{ name, email, password }` | Register, sends verification email |
| POST   | `/auth/verify-email`        | `{ token }`                 | Verify 4-digit token               |
| POST   | `/auth/resend-verification` | `{ email }`                 | Resend verification token          |
| POST   | `/auth/login`               | `{ email, password }`       | Login, returns tokens              |
| POST   | `/auth/refresh-tokens`      | `{ refreshToken }`          | Get new access token               |

#### Protected

| Method | Route                       | Roles               | Description                    |
| ------ | --------------------------- | ------------------- | ------------------------------ |
| POST   | `/auth/logout`              | Any                 | Invalidate session             |
| POST   | `/auth/create-managed-user` | ADMIN, SCHOOL_ADMIN | Create user, skip verification |
| POST   | `/auth/reset-password`      | Any                 | Force password reset           |

### School Routes

All school routes require `Authorization: Bearer <accessToken>`.

| Method | Route                         | Roles               | Description                                                     |
| ------ | ----------------------------- | ------------------- | --------------------------------------------------------------- |
| POST   | `/school/create-school`       | ADMIN               | Create a new school                                             |
| POST   | `/school/create-school-admin` | ADMIN               | Create school admin (atomic — creates auth user + admin record) |
| POST   | `/school/create-student`      | SCHOOL_ADMIN        | Create student (atomic — creates auth user + student record)    |
| GET    | `/school/all-schools`         | ADMIN               | Get all active schools                                          |
| GET    | `/school/school-details`      | ADMIN               | Get school with admins and students                             |
| GET    | `/school/school-admins`       | ADMIN               | Get all school admins                                           |
| GET    | `/school/students`            | ADMIN, SCHOOL_ADMIN | Get students by school                                          |
| GET    | `/school/student`             | ADMIN, SCHOOL_ADMIN | Get single student details                                      |
| POST   | `/school/suspend-student`     | ADMIN, SCHOOL_ADMIN | Suspend a student                                               |
| POST   | `/school/reactivate-student`  | ADMIN, SCHOOL_ADMIN | Lift suspension                                                 |
| POST   | `/school/deactivate-school`   | ADMIN               | Deactivate school                                               |
| POST   | `/school/reactivate-school`   | ADMIN               | Reactivate school                                               |
| DELETE | `/school/delete-school`       | ADMIN               | Delete school (blocked if admins or students exist)             |
| DELETE | `/school/delete-student`      | ADMIN, SCHOOL_ADMIN | Delete student record                                           |
| DELETE | `/school/delete-school-admin` | ADMIN               | Delete admin record + deactivate auth user                      |
| PUT    | `/school/update-school`       | ADMIN               | Update school fields                                            |
| POST   | `/school/admin-by-id`         | ADMIN, SCHOOL_ADMIN | Get school admin by ID                                          |

---

## Environment Variables

Create a `.env` file at the monorepo root:

```env
# Auth Database
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5432
AUTH_DB_USERNAME=postgres
AUTH_DB_PASSWORD=your_password
AUTH_DB_NAME=skillup_auth

# School Database
SCHOOL_DB_HOST=localhost
SCHOOL_DB_PORT=5432
SCHOOL_DB_USERNAME=postgres
SCHOOL_DB_PASSWORD=your_password
SCHOOL_DB_NAME=skillup_school

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Email (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_no_spaces
```

> **Note:** For `EMAIL_PASS`, generate a Gmail App Password — do not use your actual Gmail password.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- pnpm installed globally (`npm install -g pnpm`)
- Two PostgreSQL databases created: `skillup_auth` and `skillup_school`

### Installation

```bash
# clone the repository
git clone https://github.com/chika-12/skillupAfrica.git
cd skillupAfrica

# install dependencies
pnpm install

# create environment file
cp .env.example .env
# fill in your values
```

### Running the Services

Each service runs in its own terminal. Always run from the monorepo root.

```bash
# Terminal 1 — Auth Service (start first)
pnpm run start:dev auth-service

# Terminal 2 — School Service
pnpm run start:dev school-service

# Terminal 3 — API Gateway (start last)
pnpm run start:dev api-gateway
```

### Branch Strategy

```
main          — production, stable only
dev           — integration, all features merge here first
feature/*     — one branch per feature
```

---

## Tech Stack

| Layer            | Technology      | Purpose                                   |
| ---------------- | --------------- | ----------------------------------------- |
| Framework        | NestJS          | Microservice structure, DI, decorators    |
| Language         | TypeScript      | Type safety across all services           |
| Database         | PostgreSQL      | Persistent storage per service            |
| ORM              | TypeORM         | Entity mapping, repository pattern        |
| Authentication   | Passport + JWT  | Token strategy and guard system           |
| Password Hashing | bcryptjs        | Passwords and refresh token hashing       |
| Email            | Nodemailer      | Verification token delivery via Gmail     |
| Transport        | TCP             | Internal service-to-service communication |
| Validation       | class-validator | DTO validation at gateway level           |
| Config           | @nestjs/config  | Environment variable management           |
| ID Generation    | nanoid          | Unique username suffix generation         |

---

## Roadmap

- [x] Auth Service — registration, verification, login, JWT, RBAC
- [x] School Service — schools, admins, students, suspensions, atomic creation
- [ ] Payment Service — Paystack integration, per-student billing, PricingPlan
- [ ] Onboarding Service — CSV batch student creation, BullMQ queue, credential distribution
- [ ] Learning Service — courses, enrollment, progress tracking
- [ ] Notification Service — email via Nodemailer, SMS via Termii or Africa's Talking
- [ ] Progress Tracking — student performance reports, LLM suggestions
- [ ] Observability — winston structured logging, Logtail/Grafana aggregation, health checks

---

_Built by Chika Ndukwe Mark — SkillUp Africa_
