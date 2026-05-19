# SkillUp Africa — Backend Microservices

> A production-grade microservice platform delivering tech education to secondary schools across Nigeria. Built on NestJS, TypeORM, PostgreSQL, and JWT — with a clean API Gateway pattern and TCP transport between services.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Services](#services)
  - [API Gateway](#api-gateway)
  - [Auth Service](#auth-service)
- [Authentication Flow](#authentication-flow)
- [Security Design](#security-design)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

```
Client (Postman / Web / Mobile)
          │
          │  HTTP (port 3000)
          ▼
┌─────────────────────────┐
│       API Gateway        │
│                         │
│  • ValidationPipe       │
│  • JwtAuthGuard         │
│  • RolesGuard           │
│  • RpcExceptionFilter   │
└────────────┬────────────┘
             │
             │  TCP Transport
             │
    ┌────────▼────────┐
    │   Auth Service   │
    │   (port 3001)   │
    │                 │
    │  • Register     │
    │  • Verify Email │
    │  • Login        │
    │  • Refresh      │
    │  • Logout       │
    └────────┬────────┘
             │
             │  TypeORM
             ▼
    ┌─────────────────┐
    │   PostgreSQL    │
    │   (users table) │
    └─────────────────┘
```

### Why This Architecture

| Concern        | Decision           | Reason                                                                |
| -------------- | ------------------ | --------------------------------------------------------------------- |
| Transport      | TCP                | Internal services are never exposed to the public internet            |
| Entry point    | Single API Gateway | One place for all auth, validation, and access control                |
| Error handling | RpcExceptionFilter | TCP exceptions are translated to proper HTTP responses at the gateway |
| Token storage  | Hashed in DB       | Refresh tokens are bcrypt-hashed — a DB leak exposes nothing usable   |

---

## Project Structure

```
skillupAfrica/
├── apps/
│   ├── api-gateway/                  # Public HTTP entry point
│   │   └── src/
│   │       ├── auth/
│   │       │   ├── auth.controller.ts      # HTTP routes → TCP forwarding
│   │       │   ├── auth.module.ts          # Gateway auth module
│   │       │   ├── jwt.strategy.ts         # Passport JWT strategy
│   │       │   ├── jwt-auth.guard.ts       # Authentication guard
│   │       │   ├── roles.guard.ts          # Authorization guard
│   │       │   ├── roles.decorator.ts      # @Roles() decorator
│   │       │   └── rpc-exception.filter.ts # TCP → HTTP error translation
│   │       ├── api-gateway.module.ts
│   │       └── main.ts                     # HTTP server, port 3000
│   │
│   └── auth-service/                 # Internal TCP microservice
│       └── src/
│           ├── auth/
│           │   ├── dto/
│           │   │   ├── create-user.dto.ts
│           │   │   ├── login.dto.ts
│           │   │   ├── tokenVerification.dto.ts
│           │   │   ├── resendEmailToken.dto.ts
│           │   │   ├── refreshToken.dto.ts
│           │   │   └── logout.dto.ts
│           │   ├── enums/
│           │   │   └── user-role.enum.ts
│           │   ├── auth.controller.ts      # @MessagePattern handlers
│           │   ├── auth.module.ts
│           │   ├── auth.service.ts         # All business logic
│           │   └── user.entity.ts          # PostgreSQL users table
│           ├── email-service/
│           │   ├── email.module.ts
│           │   └── email.service.ts        # Nodemailer / Gmail
│           ├── auth-service.module.ts      # DB connection, config
│           └── main.ts                     # TCP server, port 3001
│
├── node_modules/
├── package.json
├── nest-cli.json
└── .env
```

---

## Services

### API Gateway

**Port:** `3000` | **Transport:** HTTP | **Role:** Public entry point

The gateway is a thin proxy. It has zero business logic. Every request is validated, authenticated if required, then forwarded to the appropriate microservice over TCP.

**Responsibilities:**

- Validate all incoming request bodies via `ValidationPipe`
- Authenticate requests via `JwtAuthGuard` on protected routes
- Enforce role-based access via `RolesGuard` and `@Roles()` decorator
- Forward requests to microservices via `ClientProxy`
- Translate TCP errors to HTTP responses via `RpcExceptionFilter`

**How to add a new service to the gateway:**

1. Create a new directory under `src/` (e.g. `src/courses/`)
2. Create `courses.module.ts` and `courses.controller.ts`
3. Register the new `ClientProxy` in `api-gateway.module.ts`
4. Import `JwtAuthGuard`, `RolesGuard`, and `Roles` from `src/auth/` — no rewriting needed

---

### Auth Service

**Port:** `3001` | **Transport:** TCP | **Role:** Identity and session management

The auth service is internal only. It cannot be reached directly from outside. All communication goes through the gateway over TCP using message patterns.

**Responsibilities:**

- User registration with email verification
- JWT access token and refresh token issuance
- Bcrypt password and refresh token hashing
- Session management via refresh token rotation
- Logout via refresh token invalidation

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

Minimum viable payload. No sensitive data. No email. No name. Just identity and permission level.

### Login Security

```typescript
// 1. check user exists
// 2. check isVerified and isActive  ← cheap DB field checks first
// 3. bcrypt.compare()               ← expensive CPU operation last
```

Fail fast on cheap checks before burning CPU cycles on bcrypt.

### Error Messages

```typescript
// User not found
throw new RpcException({
  statusCode: 401,
  message: 'Invalid email or password',
});

// Wrong password
throw new RpcException({
  statusCode: 401,
  message: 'Invalid email or password',
});
```

Identical messages for both cases. An attacker cannot determine whether an email exists in the system.

### Role-Based Access Control

```typescript
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  SCHOOL_ADMIN = 'school_admin',
  ADMIN = 'admin',
}
```

- All users self-register as `STUDENT`
- `TEACHER`, `SCHOOL_ADMIN`, and `ADMIN` roles are assigned by an existing admin via a separate endpoint
- Routes are protected with `@Roles()` at the gateway level

### TCP Error Translation

```
Auth-service throws RpcException({ statusCode: 409, message: '...' })
        ↓ travels over TCP as plain object
Gateway RpcExceptionFilter intercepts
        ↓
HTTP response with correct status code sent to client
```

---

## API Reference

### Public Routes

| Method | Route                       | Body                        | Description                                 |
| ------ | --------------------------- | --------------------------- | ------------------------------------------- |
| POST   | `/auth/register`            | `{ name, email, password }` | Register new user, sends verification email |
| POST   | `/auth/verify-email`        | `{ token }`                 | Verify 4-digit email token                  |
| POST   | `/auth/resend-verification` | `{ email }`                 | Resend verification token                   |
| POST   | `/auth/login`               | `{ email, password }`       | Login, returns access and refresh tokens    |
| POST   | `/auth/refresh-tokens`      | `{ refreshToken }`          | Exchange refresh token for new access token |

### Protected Routes

| Method | Route          | Guard          | Description                           |
| ------ | -------------- | -------------- | ------------------------------------- |
| POST   | `/auth/logout` | `JwtAuthGuard` | Invalidate refresh token, end session |

### Using Protected Routes

```
Authorization: Bearer <accessToken>
```

Add the `Authorization` header to every protected request. The gateway extracts and verifies the token. No `user_id` needed in the body — identity comes from the token.

---

## Environment Variables

Create a `.env` file at the monorepo root:

```env
# Database
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5432
AUTH_DB_USERNAME=postgres
AUTH_DB_PASSWORD=your_password
AUTH_DB_NAME=skillup_auth

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
- NestJS CLI (`pnpm add -g @nestjs/cli`)

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

Each service runs in its own terminal.

```bash
# Terminal 1 — Auth Service (must start first)
cd apps/auth-service
pnpm run start:dev

# Terminal 2 — API Gateway
cd apps/api-gateway
pnpm run start:dev
```

### Verify Everything is Running

**Auth-service output:**

```
Nest microservice successfully started
```

**Gateway output:**

```
Mapped { /auth/register, POST }
Mapped { /auth/verify-email, POST }
Mapped { /auth/resend-verification, POST }
Mapped { /auth/login, POST }
Mapped { /auth/refresh-tokens, POST }
Mapped { /auth/logout, POST }
Nest application successfully started
```

---

## Tech Stack

| Layer            | Technology      | Purpose                                   |
| ---------------- | --------------- | ----------------------------------------- |
| Framework        | NestJS          | Microservice structure, DI, decorators    |
| Language         | TypeScript      | Type safety across all services           |
| Database         | PostgreSQL      | Persistent user storage                   |
| ORM              | TypeORM         | Entity mapping, repository pattern        |
| Authentication   | Passport + JWT  | Token strategy and guard system           |
| Password Hashing | bcryptjs        | Passwords and refresh token hashing       |
| Email            | Nodemailer      | Verification token delivery via Gmail     |
| Transport        | TCP             | Internal service-to-service communication |
| Validation       | class-validator | DTO validation at gateway level           |
| Config           | @nestjs/config  | Environment variable management           |

---

## Roadmap

- [ ] Profile Service — student and teacher profiles
- [ ] Course Service — course creation, management, enrollment
- [ ] Payment Service — Paystack integration, subscription billing
- [ ] Notification Service — in-app and email notifications
- [ ] Admin Service — role assignment, platform management

---

_Built by Chika Ndukwe Mark — SkillUp Africa_
