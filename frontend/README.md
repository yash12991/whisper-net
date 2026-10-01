# WhisperNet — Web Client

The official Next.js 15 client for **WhisperNet**, an end-to-end encrypted messaging platform.

## Features
- **Client-Side Cryptography**: RSA-3072 and AES-256-GCM via the W3C Web Crypto API (`window.crypto.subtle`).
- **Interactive Security Lab**: Interactive attack simulations for bit-flipping tampering and zero-knowledge storage verification.
- **Real-Time Messaging**: Real-time delivery with Socket.IO, typing indicators, and delivery receipts.
- **Modern Cyber-Obsidian UI**: Glassmorphic dark design system with dynamic animations and custom theme presets.

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- pnpm or npm

### Installation & Run
```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the web client.

## Environment Variables
Create `.env.local` with:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## License
This project is licensed under the [MIT License](../LICENSE) - see the root LICENSE file for details.
