# WhisperNet — Comprehensive System & Technical Documentation

> **End-to-End Encrypted (E2EE) Real-Time Messaging Platform**  
> *Demonstrating Hybrid Cryptography (RSA-OAEP 3072-bit + AES-256-GCM), Forward Secrecy via Dynamic Session Key Rotation, and Zero-Knowledge Server Architecture.*

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Cryptographic Architecture & Protocols](#3-cryptographic-architecture--protocols)
   - [3.1 Cryptographic Primitives](#31-cryptographic-primitives)
   - [3.2 Identity Key Generation & Persistence](#32-identity-key-generation--persistence)
   - [3.3 Conversation Establishment (Hybrid Key Exchange)](#33-conversation-establishment-hybrid-key-exchange)
   - [3.4 Message Encryption & Nonce Safety](#34-message-encryption--nonce-safety)
   - [3.5 Message Integrity & Tampering Detection (AEAD)](#35-message-integrity--tampering-detection-aead)
   - [3.6 Dynamic Session Key Rotation (Forward Secrecy)](#36-dynamic-session-key-rotation-forward-secrecy)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Database Schema & Persistence (Prisma / PostgreSQL)](#5-database-schema--persistence-prisma--postgresql)
6. [Backend API & Real-Time Socket Architecture](#6-backend-api--real-time-socket-architecture)
   - [6.1 Authentication & Session Management](#61-authentication--session-management)
   - [6.2 REST Endpoints Reference](#62-rest-endpoints-reference)
   - [6.3 Real-Time WebSocket / Socket.IO Events](#63-real-time-websocket--socketio-events)
7. [Frontend Architecture & UI Features](#7-frontend-architecture--ui-features)
   - [7.1 Key Client Providers](#71-key-client-providers)
   - [7.2 Interactive Security Lab](#72-interactive-security-lab)
   - [7.3 Visual & Theme Customization](#73-visual--theme-customization)
8. [Threat Model & Security Boundary Analysis](#8-threat-model--security-boundary-analysis)
   - [8.1 What the Server CAN Access](#81-what-the-server-can-access)
   - [8.2 What the Server CANNOT Access (Zero-Knowledge)](#82-what-the-server-cannot-access-zero-knowledge)
   - [8.3 Academic Scope & Cryptographic Tradeoffs](#83-academic-scope--cryptographic-tradeoffs)
9. [Deployment & Environment Configuration](#9-deployment--environment-configuration)
   - [9.1 Local Development (pnpm)](#91-local-development-pnpm)
   - [9.2 Containerized Setup (Docker Compose)](#92-containerized-setup-docker-compose)
   - [9.3 Production Setup (Vercel + Supabase + Render/Railway)](#93-production-setup-vercel--supabase--renderrailway)
10. [Demonstration & Viva Verification Guide](#10-demonstration--viva-verification-guide)

---

## 1. System Overview

**WhisperNet** is a full-stack, end-to-end encrypted messaging application developed for academic and practical demonstration of modern cryptographic engineering principles.

At its core, WhisperNet guarantees **client-side confidential communication**:
- **Plaintext messages never touch the network or the database.**
- All cryptographic key generation, asymmetric key wrapping, symmetric bulk encryption, and integrity verification take place exclusively in the user's browser runtime via the standard **W3C Web Crypto API (`window.crypto.subtle`)**.
- The backend serves solely as a zero-knowledge relay and ciphertext persistence store.
- Cryptographic tampering is immediately detected through **AES-GCM Authenticated Encryption with Associated Data (AEAD)**.
- Session keys rotate automatically every 30 messages, demonstrating ratcheting and forward secrecy principles.

### 1.1 Project Identity & Rebranding
- **Application Name**: **WhisperNet** (formerly referred to as *Ciphera* / *SecureChat*).
- **Client Metadata & Title**: Set to `WhisperNet` in Next.js layout metadata and UI components.
- **Client Cache Keys**: `whispernet_chatTheme` (with automatic backward compatibility for legacy cache values).
- **Root Package Identifier**: `whispernet` in `package.json`.
- **Cryptographic Package**: Modularized under the internal monorepo package `@securechat/crypto` using standard W3C Web Cryptography primitives.

---

## 2. High-Level Architecture

The platform is designed around a modern multi-tier decoupled architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME (Client)                        │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │    Next.js 15 UI      │             │   @securechat/crypto       │  │
│  │ (React 19, Tailwind)  │             │   (W3C Web Crypto API)     │  │
│  └──────────┬────────────┘             └─────────────┬──────────────┘  │
│             │                                        │                 │
│             │  Generates Keys / Encrypts / Decrypts  │                 │
│             └────────────────────────────────────────┘                 │
│                 │                                  │                   │
│         Plaintext UI Only               Ciphertext + Nonce + PEM       │
└─────────────────┼──────────────────────────────────┼───────────────────┘
                  │ HTTPS (Cookies)                  │ WSS (Socket.IO)
                  ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND RUNTIME (Express.js)                       │
│                                                                        │
│  ┌───────────────────────────────┐     ┌────────────────────────────┐  │
│  │   REST API Controllers        │     │ Socket.IO Real-time Engine │  │
│  │ - Argon2id Password Hashing   │     │ - Ciphertext Broadcast     │  │
│  │ - JWT (HttpOnly Cookie Auth)  │     │ - Ephemeral Room Routing   │  │
│  │ - User & Key Metadata Query   │     │ - Key Rotation Broadcast   │  │
│  └──────────────┬────────────────┘     └─────────────┬──────────────┘  │
└─────────────────┼────────────────────────────────────┼─────────────────┘
                  │                                    │
                  └───────────────┬────────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE (PostgreSQL)                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tables: User | Conversation | Member | SessionKey | Message      │  │
│  │ (Stores Hashed Passwords, RSA Public Keys, Ciphertexts, Nonces)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cryptographic Architecture & Protocols

### 3.1 Cryptographic Primitives

| Purpose | Algorithm / Primitive | Parameters | Standard Reference |
| :--- | :--- | :--- | :--- |
| **Password Hashing** | Argon2id | Memory: 64 MB ($2^{16}$ KB), Time: 3 passes, Parallelism: 1 | RFC 9106 |
| **Identity Key Exchange** | RSA-OAEP | 3072-bit modulus, $e=65537$, SHA-256 hash | RFC 8017 (PKCS#1 v2.2) |
| **Bulk Message Encryption** | AES-GCM | 256-bit symmetric key, 96-bit random nonce, 128-bit auth tag | NIST SP 800-38D |
| **Entropy Source** | CSPRNG | `crypto.getRandomValues()` | W3C Web Cryptography API |
| **Transport Layer** | TLS 1.3 | AES-GCM / ChaCha20-Poly1305 over WSS/HTTPS | RFC 8446 |

### 3.2 Identity Key Generation & Persistence

1. **Client-Side Generation**: When a user registers (or logs in without a cached key), the client invokes `generateRSAKeyPair()`:
   ```typescript
   crypto.subtle.generateKey(
     {
       name: "RSA-OAEP",
       modulusLength: 3072,
       publicExponent: new Uint8Array([1, 0, 1]),
       hash: "SHA-256",
     },
     true,
     ["encrypt", "decrypt"]
   );
   ```
2. **Public Key Export**: The public key is exported into SPKI format, Base64-encoded, wrapped in standard PEM boundaries (`-----BEGIN PUBLIC KEY-----`), and transmitted to the server to be published in the database.
3. **Private Key Storage**: The private key is serialized as a JSON Web Key (JWK) string and stored in the browser's `localStorage` (`securechat_private_key_<userId>`). The private key **never leaves the device**.

### 3.3 Conversation Establishment (Hybrid Key Exchange)

When User A starts a chat with User B:

```
User A (Client)                                          User B (Client)
      │                                                         │
      │ 1. GET /api/users?q=UserB                               │
      ├───────────────────────► [Backend]                       │
      │◄──────────────────────  Returns User B RSA Public Key   │
      │                                                         │
      │ 2. Generate random AES-256 session key (K_s)            │
      │ 3. Encrypt K_s with User B Public Key: E_B(K_s)         │
      │ 4. Encrypt K_s with User A Public Key: E_A(K_s)         │
      │                                                         │
      │ 5. POST /api/conversations                              │
      │    Body: { targetUserId: B,                             │
      │            initialEncryptedKeyMaterial: {               │
      │              A: E_A(K_s),                               │
      │              B: E_B(K_s)                                │
      │            }}                                           │
      ├───────────────────────► [Backend Stores Key v1]         │
      │                                │                        │
      │                                │ 6. User B fetches conv │
      │                                ├───────────────────────►│
      │                                │                        │
      │                                │                        │ 7. Decrypts E_B(K_s)
      │                                │                        │    using Private Key B
      │                                │                        │ 8. Recovers K_s in RAM
```

Because both $E_A(K_s)$ and $E_B(K_s)$ are recorded, both participants can decrypt and use the exact same symmetric session key $K_s$ without exposing it to the server.

### 3.4 Message Encryption & Nonce Safety

For every message $M$:
1. A fresh **96-bit (12-byte) Cryptographic Nonce** (Initialization Vector) is produced using `crypto.getRandomValues(new Uint8Array(12))`.
2. AES-GCM processes the UTF-8 encoded text using the active session key:
   $$\text{Ciphertext} \,||\, \text{AuthTag} \leftarrow \text{AES-256-GCM}_{K_s}(\text{IV}, M)$$
3. The resulting binary is Base64 encoded into `ciphertext` (which includes the 128-bit authentication tag appended by Web Crypto API) and `nonce`.
4. The client emits the payload via Socket.IO:
   ```json
   {
     "conversationId": "uuid",
     "ciphertext": "base64...",
     "nonce": "base64...",
     "keyVersion": 1
   }
   ```

### 3.5 Message Integrity & Tampering Detection (AEAD)

AES-GCM computes a GMAC authentication tag during encryption. During decryption:
```typescript
try {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    sessionKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
} catch (error) {
  throw new Error("Message authentication failed. The message may have been modified.");
}
```
If a single bit in the ciphertext or nonce is modified in transit or altered directly in the PostgreSQL database, `crypto.subtle.decrypt` aborts and throws an exception. The UI flags the message with a red alert badge: `[Tampering Detected - Authentication Failed]`.

### 3.6 Dynamic Session Key Rotation (Forward Secrecy)

To limit the blast radius if an ephemeral symmetric key is compromised:
- **Threshold**: The client tracks the message counter. Every **30 messages** (`messages.length % 30 === 0`), key rotation is automatically triggered.
- **Protocol**:
  1. The client generates a fresh AES-256-GCM session key $K_{s}'$.
  2. The client re-encrypts $K_{s}'$ with both User A's and User B's RSA public keys.
  3. The client increments the version: $\text{keyVersion} = v + 1$.
  4. The client emits a `key_rotation` socket event to the server.
  5. The server records the new version in `SessionKeyMetadata` and marks the previous key as `rotatedAt = now()`.
  6. Both clients switch their `activeSessionKey` to $K_{s}'$.
  7. Messages encrypted under older keys cannot be decrypted if only the active session key is exposed.

---

## 4. Monorepo Structure

```
WhisperNet/
├── package.json              # Monorepo root workspace configuration
├── pnpm-workspace.yaml       # pnpm workspace packages definition
├── pnpm-lock.yaml            # Pinned dependency lockfile
├── docker-compose.yml        # Multi-container orchestration (DB, Server, Web)
├── Dockerfile                # Root dockerfile template
├── SECURITY.md               # Threat model and security boundaries
├── README.md                 # Project summary and quickstart
├── DOCUMENTATION.md          # Comprehensive technical documentation
│
├── prisma/
│   └── schema.prisma         # PostgreSQL schema definition & models
│
├── packages/
│   ├── crypto/               # Core cryptographic library (@securechat/crypto)
│   │   ├── src/index.ts      # Web Crypto API RSA & AES-GCM implementations
│   │   ├── test-crypto.js    # Standalone cryptographic verification script
│   │   └── package.json
│   ├── types/                # Shared TypeScript type definitions
│   └── config/               # Shared project configurations
│
├── backend/                  # Express.js REST & WebSocket Server
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Server entrypoint (HTTP + Socket.IO)
│       ├── auth/             # Register, Login, Logout, /me controllers
│       ├── users/            # Search users, get public key, delete account
│       ├── conversations/    # Direct & Group conversation creation/fetch
│       ├── database/         # Prisma client instance singleton (db.ts)
│       ├── middleware/       # JWT authentication middleware
│       └── socket/           # Real-time message, delivery & rotation handlers
│
└── frontend/                 # Next.js 15 App Router Frontend
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx    # Root layout with AuthProvider & SocketProvider
        │   ├── page.tsx      # Landing page / redirection logic
        │   ├── login/        # Animated sign-in page
        │   ├── register/     # Animated sign-up with client-side RSA keygen
        │   ├── dashboard/    # Split-view chat dashboard
        │   └── security/     # Interactive Security Lab (tamper simulations)
        ├── components/
        │   ├── ChatWindow.tsx# Message stream, live decryption, rotation logic
        │   ├── Sidebar.tsx   # User search, conversation list, group creation
        │   └── ui/           # Custom inputs, emoji picker, canvas animations
        ├── hooks/
        │   ├── useAuth.tsx   # Authentication context & private key manager
        │   └── useSocket.tsx # Socket.io connection & presence context
        └── lib/
            └── theme.ts      # UI color palette and design tokens
```

---

## 5. Database Schema & Persistence (Prisma / PostgreSQL)

The database strictly isolates identity metadata from cryptographic ciphertext payloads:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String   @unique
  passwordHash String   // Argon2id hash
  publicKey    String   // PEM encoded RSA 3072-bit public key
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  memberships  ConversationMember[]
  messages     Message[]
}

model Conversation {
  id           String   @id @default(uuid())
  isGroup      Boolean  @default(false)
  name         String?  // Optional group name
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  members      ConversationMember[]
  messages     Message[]
  sessionKeys  SessionKeyMetadata[]
}

model ConversationMember {
  id             String   @id @default(uuid())
  conversationId String
  userId         String
  
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])
}

model SessionKeyMetadata {
  id                   String   @id @default(uuid())
  conversationId       String
  keyVersion           Int
  createdAt            DateTime @default(now())
  rotatedAt            DateTime?
  
  // JSON map: { [userId: string]: string (RSA-OAEP encrypted AES key in Base64) }
  encryptedKeyMaterial String   
  
  conversation         Conversation @relation(fields: [conversationId], references: [id])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  ciphertext     String   // AES-256-GCM encrypted payload (Base64)
  nonce          String   // Unique 96-bit IV (Base64)
  authTag        String   // AES-GCM Authentication Tag (Base64)
  keyVersion     Int      // Reference to active SessionKey version
  createdAt      DateTime @default(now())
  deliveredAt    DateTime?
  readAt         DateTime?
  
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation(fields: [senderId], references: [id])
}
```

---

## 6. Backend API & Real-Time Socket Architecture

### 6.1 Authentication & Session Management
- **Passwords**: Hashed with `argon2id` (RFC 9106) using memory cost $2^{16}$ (64 MB) and 3 iterations.
- **Session Tokens**: Signed JWT containing `{ userId }`, valid for 24 hours.
- **Cookie Security**: Set in HTTP response with `httpOnly: true`, `secure: true` (in production), and `sameSite: 'none'` (cross-origin) or `'lax'`.
- **Socket Tokens**: A dedicated short-lived JWT (1 minute TTL) endpoint `/api/auth/socket-token` ensures reliable WebSocket handshake authentication even when cross-origin cookie policies restrict headers.

### 6.2 REST Endpoints Reference

#### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Creates user, hashes password, saves RSA public key | No |
| `POST` | `/api/auth/login` | Verifies credentials, updates public key if changed, issues cookie | No |
| `POST` | `/api/auth/logout` | Clears `token` cookie | No |
| `GET` | `/api/auth/me` | Returns current authenticated user record | Cookie |
| `GET` | `/api/auth/socket-token`| Generates 60s single-use token for Socket.IO connection | Cookie |

#### Users Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users?q=<name>` | Searches users by prefix, returns IDs and RSA Public Keys | Yes |
| `GET` | `/api/users/:id/public-key`| Fetches public key of a specific user | Yes |
| `DELETE`| `/api/users/me` | Cascading account deletion (wipes conversations, keys, messages)| Yes |

#### Conversations Routes (`/api/conversations`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/conversations` | Establishes direct conversation with initial encrypted key material | Yes |
| `POST` | `/api/conversations/group` | Establishes multi-party conversation with encrypted keys per member | Yes |
| `GET` | `/api/conversations` | Lists all conversations for the authenticated user | Yes |
| `GET` | `/api/conversations/:id` | Fetches conversation metadata, participant keys, latest session key | Yes |
| `GET` | `/api/conversations/:id/messages`| Returns last 100 encrypted message records for the conversation | Yes |

### 6.3 Real-Time WebSocket / Socket.IO Events

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `join_conversation` | Client $\to$ Server | `conversationId` | Joins socket room `conversation:<id>` |
| `send_message` | Client $\to$ Server | `{ conversationId, ciphertext, nonce, authTag, keyVersion }` | Persists ciphertext in DB and broadcasts to room |
| `receive_message` | Server $\to$ Client | Full `Message` record with sender metadata | Delivers incoming message to active chat |
| `key_rotation` | Client $\to$ Server | `{ conversationId, keyVersion, encryptedKeyMaterial }` | Stores key version $n+1$, broadcasts to all room members |
| `message_delivered` | Bidirectional | `{ conversationId, messageIds, deliveredAt }` | Marks messages as delivered (double checkmark) |
| `message_read` | Bidirectional | `{ conversationId, messageIds, readAt }` | Marks messages as read (blue/active checkmark) |
| `typing_start` | Bidirectional | `{ conversationId, userId }` | Displays live typing indicator |
| `typing_stop` | Bidirectional | `{ conversationId, userId }` | Clears live typing indicator |
| `user_online` / `user_offline` | Server $\to$ Client | `userId` | Updates real-time presence indicators in sidebar |

---

## 7. Frontend Architecture & UI Features

### 7.1 Key Client Providers
- **`AuthProvider` (`useAuth.tsx`)**:
  - Initializes session state by pinging `/api/auth/me`.
  - Rehydrates the RSA Private Key from `localStorage` using `importPrivateKey(storedKey)`.
  - Exposes `login()`, `register()`, `logout()`, `deleteAccount()`, and `getPrivateKey()`.
- **`SocketProvider` (`useSocket.tsx`)**:
  - Fetches the short-lived socket token from `/api/auth/socket-token`.
  - Connects to Socket.IO with fallback transports (`['polling', 'websocket']`).
  - Manages online user sets and presence events.

### 7.2 Interactive Security Lab
Located at `/security`, the Security Lab provides live visual proof of the system's cryptographic integrity:

1. **Message Tampering Simulation**:
   - Generates an in-memory AES-GCM session key.
   - Encrypts `'Secret Data'` to produce valid ciphertext and nonce.
   - Flips one byte of the ciphertext (`ciphertext.charCodeAt(0) ^ 1`).
   - Attempts decryption using `crypto.subtle.decrypt`.
   - **Result**: Proves that AES-GCM fails authentication and rejects altered data with:  
     `"Message authentication failed. The message may have been modified."`
2. **Unauthorized Access Simulation**:
   - Sends an HTTP request to access conversation `00000000-0000-0000-0000-000000000000`.
   - **Result**: Proves the backend blocks unauthorized snooping with `403 Forbidden` or `404 Not Found`.
3. **Database Exposure Demonstration**:
   - Displays the exact database representation of stored messages (`ciphertext`, `nonce`, `authTag`).
   - **Result**: Confirms that a complete server database leak yields zero plaintext.

### 7.3 Visual & Design System Overhaul
WhisperNet features an ultra-premium, dark-mode cybersecurity and Web3-inspired design system:
- **Obsidian Noir & Cyber-Grid**: Tailored deep-space slate background (`#080c14`) layered with subtle 32px cybernetic grid patterns.
- **Glassmorphic Paneling**: Frosted glass containers (`rgba(14, 21, 38, 0.75)`) with backdrop blur filters, hairline borders, and atmospheric neon emerald (`#10b981`) and cyan (`#06b6d4`) glow highlights.
- **Gradient Message Bubbles**: Outgoing messages feature a vibrant emerald-to-teal gradient (`#059669` to `#0d9488`) with formatted timestamps and dual delivery status checkmarks. Incoming messages render on frosted glass obsidian surfaces.
- **Interactive Authenticated Empty State**: Features an ambient `PixelBlast` particle canvas, a dual-ring pulsating shield emblem, and three interactive cryptographic architecture cards.
- **Floating Input Dock**: Pill-shaped input console with integrated emoji picker, focus glow transitions, and an end-to-end encryption indicator lock.
- **Audio Feedback Engine**: Zero-asset sound effects synthesized in real-time via Web Audio API oscillators for send and receive micro-interactions.

### 7.4 Security Feedback & Real-Time Indicators
- **Key Generation Progress**: Real-time visual feedback with animated spinners when the browser is computing 3072-bit RSA key pairs.
- **Live AEAD Tamper Alerts**: Modified ciphertexts are rendered inside specialized neon-red warning cards detailing tag authentication failure.
- **Presence Indicators**: Pulsating green status rings denoting active socket sessions.

---

## 8. Threat Model & Security Boundary Analysis

### 8.1 What the Server CAN Access
- **Metadata**: User account names, email addresses, creation timestamps.
- **Social Graph**: Who is in a conversation with whom, conversation creation time.
- **Public Keys**: User 3072-bit RSA public keys.
- **Message Footprint**: Exact ciphertext byte length, delivery timestamps, read status, and message transmission frequency (traffic volume analysis).
- **Encrypted Session Keys**: Base64 encrypted blobs containing symmetric key material.

### 8.2 What the Server CANNOT Access (Zero-Knowledge)
- **Plaintext Messages**: At no point does raw message text cross the network or enter server logs.
- **AES-256 Symmetric Session Keys**: Only participants who possess the corresponding RSA Private Key can unwrap the session key.
- **RSA Private Keys**: Keys are generated in the browser and stored locally. The server never receives private key material.
- **Ciphertext Modification Ability**: Any tampering by the server or an adversary causes AES-GCM authentication failure at the client.

### 8.3 Academic Scope & Cryptographic Tradeoffs
While WhisperNet provides robust E2EE, the following design decisions reflect an educational scope:

| Feature | WhisperNet Academic Implementation | Production Industry Standard (Signal Protocol) |
| :--- | :--- | :--- |
| **Forward Secrecy** | Rotates AES session key every 30 messages using RSA-OAEP re-wrap. | **Double Ratchet Algorithm** (X25519 DH ratchet + symmetric KDF ratchet after every message). |
| **Post-Compromise Security** | If the RSA private key is ever exposed, all past sessions wrapped with it can be decrypted. | Ephemeral Diffie-Hellman exchanges ensure past and future keys remain unrecoverable. |
| **Key Backup** | Kept in browser `localStorage`. Logging in from a new device generates a new key pair. | Encrypted local secure enclave or password-derived key vaults (PBKDF2/Argon2 encrypted key vaults). |
| **Identity Verification** | Assumes server returns genuine public keys. | Out-of-band **Safety Numbers** (QR code fingerprint comparison) to prevent rogue server MITM. |

---

## 9. Deployment & Environment Configuration

### 9.1 Local Development (pnpm)

#### Prerequisites
- Node.js 18+ or 20+
- pnpm 9+
- PostgreSQL instance running locally on port 5432

#### Setup Steps
```bash
# 1. Install all dependencies across the monorepo
pnpm install

# 2. Configure environment variables in root or packages
# backend/.env:
DATABASE_URL="postgresql://postgres:password@localhost:5432/securechat_db"
JWT_SECRET="your-development-jwt-secret-key"
SERVER_PORT=4000
CLIENT_URL="http://localhost:3000"

# frontend/.env.local:
NEXT_PUBLIC_API_URL="http://localhost:4000/api"

# 3. Synchronize database schema
pnpm dlx prisma db push

# 4. Start backend and frontend concurrently
pnpm --filter backend dev
pnpm --filter frontend dev
```

### 9.2 Containerized Setup (Docker Compose)
Runs PostgreSQL, the Express backend, and the Next.js frontend in a single isolated network:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

### 9.3 Production Setup (Vercel + Supabase + Render/Railway)

1. **Database (Supabase)**:
   - Create a project on [Supabase](https://supabase.com).
   - In `prisma/schema.prisma`, use pooled connection URL for `DATABASE_URL` and direct connection URL for `DIRECT_URL`.
   - Run: `pnpm dlx prisma db push`.
2. **Backend (Render / Railway)**:
   - Real-time Socket.IO servers require persistent processes (serverless platforms like Vercel will terminate WebSockets).
   - Deploy `backend` as a Web Service on Render or Railway.
   - Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CLIENT_URL=https://<your-frontend>.vercel.app`, `SERVER_PORT=4000`.
3. **Frontend (Vercel)**:
   - Deploy `frontend` on Vercel.
   - Set `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com/api`.

---

## 10. Demonstration & Viva Verification Guide

For academic reviews, project presentations, and examinations:

1. **Two-Party E2EE Demonstration**:
   - Open standard Chrome window: Navigate to `http://localhost:3000`, register as `Alice`.
   - Open Chrome Incognito window: Navigate to `http://localhost:3000`, register as `Bob`.
   - From Alice's screen, search for `Bob` and send a message.
   - Verify that Bob receives the message instantly via Socket.IO with the badge `E2E Encrypted` and `Key v1`.
2. **Key Rotation (Forward Secrecy Simulation)**:
   - Rapidly send 30 messages in the chat.
   - Observe the key badge transition from **`Key v1`** to **`Key v2`**.
   - Check the console logs: `Threshold reached (30 messages). Rotating key...`.
3. **Integrity Validation (Tampering Simulation)**:
   - Open `/security` from the sidebar menu.
   - Click **Run Simulation** under **Message Tampering**.
   - Observe how AES-GCM detects the 1-bit alteration and rejects the ciphertext.
4. **Zero-Knowledge Database Verification**:
   - Inspect the PostgreSQL `Message` table:
     ```sql
     SELECT id, "senderId", ciphertext, nonce, "authTag", "keyVersion" FROM "Message";
     ```
   - Verify that all records contain high-entropy Base64 ciphertext with zero readable plaintext.
