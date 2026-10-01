import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import conversationsRoutes from './conversations/conversations.routes';
import { setupSocketHandlers } from './socket/socket';

dotenv.config();

const clientUrl = process.env.CLIENT_URL || '';
const parsedClientUrls = clientUrl ? clientUrl.split(',').map(u => u.trim().replace(/\/+$/, '')) : [];

const allowedOrigins = [
  'http://localhost:3000',
  'https://whispernet-chat.vercel.app',
  'https://ciphera-chat.vercel.app',
  ...parsedClientUrls
].filter(Boolean);

const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  const normalizedOrigin = origin.replace(/\/+$/, '');
  if (
    allowedOrigins.includes(normalizedOrigin) ||
    normalizedOrigin.endsWith('.vercel.app') ||
    normalizedOrigin.includes('localhost') ||
    normalizedOrigin.includes('127.0.0.1')
  ) {
    return callback(null, true);
  }
  callback(null, true);
};

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io integration
setupSocketHandlers(io);

const PORT = process.env.SERVER_PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`WhisperNet Server is running on port ${PORT}`);
});
