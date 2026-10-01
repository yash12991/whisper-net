# WhisperNet — Backend Server

The Express.js and Socket.IO real-time relay and persistence engine for **WhisperNet**.

## Role in Architecture
- **Zero-Knowledge Relay**: Acts purely as an unprivileged relayer for encrypted ciphertexts and metadata.
- **Authentication**: Argon2id password hashing and secure HttpOnly cookie session management.
- **Database Engine**: Manages PostgreSQL persistence via Prisma ORM.
- **Real-Time WebSockets**: Socket.IO server handling room routing, delivery receipts, and session key rotation broadcasts.

## Getting Started

### Environment Variables
Configure `.env` with:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="supersecretfallback_pleasechange_whispernet_2026"
SERVER_PORT=4000
CLIENT_URL="http://localhost:3000"
```

### Installation & Run
```bash
# Push Prisma schema to database
npx prisma db push --schema=../prisma/schema.prisma

# Start server
npm run dev
```

## License
This project is licensed under the [MIT License](../LICENSE) - see the root LICENSE file for details.
