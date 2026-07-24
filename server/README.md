# StayHub Server — Module 3: Authentication & Authorization

Production-ready role-based authentication for the StayHub multi-hotel management API.

**Stack:** Express.js · PostgreSQL (Supabase) · Sequelize ORM · JWT · bcrypt

---

## Quick Start

```bash
# Install dependencies
npm install bcrypt jsonwebtoken express-validator helmet express-rate-limit cors

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and a strong JWT_SECRET

# Run migration (adds isBanned, renames role owner → hotel_owner)
npx sequelize-cli db:migrate

# Start the server
npm run dev
```

### Environment Variables (`.env`)

```
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

Optional: `CLIENT_URL=http://localhost:5173` for CORS.

---

## API Overview

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/auth/register` | Public (rate-limited) | — | Register a new user |
| POST | `/api/auth/login` | Public (rate-limited) | — | Login and receive JWT |
| GET | `/api/hotels` | Public | — | List all hotels + rooms |
| POST | `/api/hotels` | JWT | `hotel_owner`, `admin` | Create a hotel |
| PUT | `/api/hotels/:id` | JWT | `hotel_owner`, `admin` | Update hotel (ownership check) |
| DELETE | `/api/hotels/:id` | JWT | `hotel_owner`, `admin` | Delete hotel (ownership check) |
| POST | `/api/bookings` | JWT | `customer` | Create a booking |
| GET | `/api/bookings/my-bookings` | JWT | `customer` | List own bookings |
| GET | `/api/admin/users` | JWT | `admin` | List all users |
| DELETE | `/api/admin/users/:id` | JWT | `admin` | Delete a user |

---

## 1. Authentication Flow

### Registration

1. Client sends `POST /api/auth/register` with `{ name, email, password, role? }`.
2. `express-validator` checks: name not empty, valid email, password ≥ 8 chars with at least one number, optional role in enum.
3. Controller checks for duplicate email → **409 Conflict** if found.
4. Password is hashed with **bcrypt** (10 salt rounds) via `hashPassword()`.
5. User row is created in PostgreSQL through Sequelize (`role` defaults to `customer`).
6. A JWT is generated with payload `{ id, role }` and `expiresIn` from `.env`.
7. Response **201** returns `{ user }` (password stripped) and `{ token }`.

### Login

1. Client sends `POST /api/auth/login` with `{ email, password }`.
2. Validation ensures email is valid and password is present.
3. User is loaded **with password** via the `withPassword` Sequelize scope.
4. If user is missing **or** password does not match → generic **401** `"Invalid email or password"` (prevents user enumeration).
5. If `isBanned === true` → **403 Forbidden**.
6. JWT is generated and returned with the sanitized user (**200**).

### JWT Generation

- Utility: `server/utils/tokenUtils.js` → `generateToken(user)`.
- Signed with `JWT_SECRET`; expiry from `JWT_EXPIRES_IN` (e.g. `7d`).
- Payload never includes the password or email — only `id` and `role`.

### Protected Requests

1. Client sends `Authorization: Bearer <token>` on protected routes.
2. `authenticate` middleware extracts the token, verifies it with `jwt.verify`.
3. Specific errors:
   - `TokenExpiredError` → **401** “Token has expired…”
   - `JsonWebTokenError` → **401** “Invalid token…”
4. On success, `req.user = { id, role }` is attached.
5. `authorize(...roles)` then checks `req.user.role` against the allowed list → **403** if not permitted.
6. Controllers may apply an extra **ownership check** (see RBAC section).

---

## 2. Password Security

### Why bcrypt?

bcrypt is a slow, adaptive hashing algorithm designed for passwords. The intentional cost (work factor / salt rounds) makes offline brute-force and rainbow-table attacks expensive. StayHub uses **10 salt rounds**.

### Why hashing matters

If the database is compromised, attackers should not recover original passwords. Storing only a one-way hash means even administrators cannot read user passwords. StayHub **never returns** the password field (hashed or plain) in any API response.

### Hashing vs Encryption

| | **Hashing** (bcrypt) | **Encryption** (AES, etc.) |
|---|---|---|
| Direction | One-way (cannot reverse) | Two-way (decrypt with key) |
| Purpose | Verify secrets without storing them | Protect data that must be recovered |
| Key | Salt (not a secret for recovery) | Secret key required to decrypt |
| Use case | Passwords | Credit cards, PII at rest |

Passwords must be **hashed**, not encrypted — there is no legitimate need to ever recover the original password.

---

## 3. JWT Explained

A JWT has three Base64URL-encoded parts separated by dots: `header.payload.signature`.

### Header

Algorithm and token type:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload

Claims about the user (StayHub stores `id` and `role`, plus standard `iat` / `exp`):

```json
{
  "id": 42,
  "role": "customer",
  "iat": 1721846400,
  "exp": 1722451200
}
```

### Signature

HMAC-SHA256 of `base64url(header) + "." + base64url(payload)` using `JWT_SECRET`. Tampering with header or payload invalidates the signature.

### Sample decoded JWT

```
FAKESECRET_a3b4c5d6e7f8g9h0i1j2
```

| Section | Value (decoded) |
|---------|-----------------|
| **Header** | `{ "alg": "HS256", "typ": "JWT" }` |
| **Payload** | `{ "id": 42, "role": "hotel_owner", "iat": 1516239022 }` |
| **Signature** | HMACSHA256(header + "." + payload, JWT_SECRET) |

> Note: The sample signature above is illustrative. Real tokens are verified server-side; never trust a client-decoded payload alone.

---

## 4. Role-Based Access Control (RBAC)

### Authentication vs Authorization

- **Authentication** — *Who are you?* Proven by a valid JWT (`authenticate` middleware).
- **Authorization** — *What are you allowed to do?* Proven by role membership (`authorize('admin')`, etc.).

A user can be authenticated but still forbidden from an admin-only route (**403**).

### Roles

| Role | Capabilities |
|------|----------------|
| `customer` | Create bookings, view own bookings |
| `hotel_owner` | Create/update/delete **own** hotels |
| `admin` | Manage hotels (any owner), list/delete users |

### Ownership Check (`hotelController`)

Even after `authorize('hotel_owner', 'admin')`:

1. Load the hotel by `:id`.
2. If `req.user.role === 'hotel_owner'` **and** `hotel.ownerId !== req.user.id` → **403**.
3. If `req.user.role === 'admin'` → ownership is **bypassed**; admins may update/delete any hotel.

This prevents hotel owners from mutating competitors’ properties while still allowing platform admins full control.

---

## 5. Mermaid Diagrams

### Authentication Lifecycle (Flowchart)

```mermaid
flowchart TD
  A[Client: Register or Login] --> B{Endpoint}
  B -->|POST /api/auth/register| C[Validate input]
  B -->|POST /api/auth/login| D[Validate input]
  C --> E{Email already exists?}
  E -->|Yes| F[409 Conflict]
  E -->|No| G[bcrypt hashPassword]
  G --> H[Sequelize User.create]
  H --> I[generateToken id + role]
  I --> J[201 User + JWT]
  D --> K[Find user withPassword]
  K --> L{User exists and password matches?}
  L -->|No| M[401 Invalid email or password]
  L -->|Yes| N{isBanned?}
  N -->|Yes| O[403 Banned]
  N -->|No| P[generateToken]
  P --> Q[200 User + JWT]
  J --> R[Client stores JWT]
  Q --> R
  R --> S[Subsequent requests: Authorization Bearer token]
```

### Login → JWT → Protected Route (Sequence)

```mermaid
sequenceDiagram
  participant Client
  participant Express
  participant Sequelize
  participant PostgreSQL

  Client->>Express: POST /api/auth/login { email, password }
  Express->>Express: validateLogin middleware
  Express->>Sequelize: User.scope(withPassword).findOne
  Sequelize->>PostgreSQL: SELECT * FROM "Users" WHERE email = ?
  PostgreSQL-->>Sequelize: user row
  Sequelize-->>Express: user instance
  Express->>Express: comparePassword bcrypt
  Express->>Express: generateToken JWT sign
  Express-->>Client: 200 { user, token }

  Client->>Express: GET /api/bookings/my-bookings<br/>Authorization: Bearer token
  Express->>Express: authenticate jwt.verify
  Express->>Express: authorize customer
  Express->>Sequelize: Booking.findAll where userId = req.user.id
  Sequelize->>PostgreSQL: SELECT bookings...
  PostgreSQL-->>Sequelize: rows
  Sequelize-->>Express: bookings
  Express-->>Client: 200 { data: bookings }
```

### Architecture Diagram

```mermaid
flowchart LR
  subgraph Frontend
    React[React SPA]
  end

  subgraph Backend
    Express[Express.js API]
    MW[Auth / Authorize / Validate / Rate Limit / Helmet]
    Ctrl[Controllers]
    Utils[passwordUtils / tokenUtils]
  end

  subgraph Data
    Sequelize[Sequelize ORM]
    PG[(PostgreSQL via Supabase)]
  end

  React -->|HTTPS JSON + JWT| Express
  Express --> MW
  MW --> Ctrl
  Ctrl --> Utils
  Ctrl --> Sequelize
  Sequelize --> PG
```

### Route Protection Decision Tree

```mermaid
flowchart TD
  Start[Incoming Request] --> Public{Public route?}
  Public -->|Yes e.g. GET /api/hotels| Allow[Controller executes]
  Public -->|No| Auth{Valid Bearer JWT?}
  Auth -->|No / expired / invalid| U401[401 Unauthorized]
  Auth -->|Yes req.user set| Role{role in allowedRoles?}
  Role -->|No| F403[403 Forbidden]
  Role -->|Yes| Own{Ownership required?}
  Own -->|No| Allow
  Own -->|Yes hotel update/delete| Check{admin OR hotel.ownerId === user.id?}
  Check -->|No| O403[403 Ownership denied]
  Check -->|Yes| Allow
```

---

## Project Structure

```
server/
├── index.js                          # App entry: helmet, cors, rate-limit, routers, errors
├── .env / .env.example
├── config/config.js
├── models/
│   ├── index.js
│   ├── user.js                       # name, email, password, role, isBanned
│   ├── hotel.js
│   ├── room.js
│   └── booking.js
├── utils/
│   ├── passwordUtils.js              # hashPassword, comparePassword
│   └── tokenUtils.js                 # generateToken
├── middleware/
│   ├── authMiddleware.js             # authenticate
│   ├── authorizeMiddleware.js        # authorize(...roles)
│   └── validationMiddleware.js       # validateRegister, validateLogin
├── controllers/
│   ├── authController.js
│   ├── hotelController.js
│   ├── bookingController.js
│   └── adminController.js
├── routes/
│   ├── authRoutes.js
│   ├── hotelRoutes.js
│   ├── bookingRoutes.js
│   └── adminRoutes.js
└── migrations/
    └── 20260724120000-update-user-auth-fields.js
```

---

## Security Features (Bonus)

- **Helmet** — secure HTTP headers
- **CORS** — restricted to frontend origin
- **express-rate-limit** — 5 requests / 15 minutes on `/api/auth/login` and `/api/auth/register`
- **bcrypt** password hashing (never store or return plaintext)
- **JWT** with expiry and typed error handling
- **Generic login errors** to prevent email enumeration
- **`isBanned` gate** on login
- **Ownership checks** on hotel mutations
- **Global 404 + error middleware**

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Owner","email":"ada@stayhub.com","password":"secret123","role":"hotel_owner"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@stayhub.com","password":"secret123"}'
```

### Create Hotel (protected)

```bash
curl -X POST http://localhost:5000/api/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_HERE" \
  -d '{"name":"Sunset Inn","city":"Lahore","description":"Quiet boutique stay"}'
```
