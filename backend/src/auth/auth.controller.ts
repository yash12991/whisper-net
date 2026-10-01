import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback_pleasechange';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      username, 
      email, 
      password, 
      publicKey,
      encryptedPrivateKey,
      keySalt,
      keyIv,
      signingPublicKey,
      encryptedSigningKey,
      signingKeyIv
    } = req.body;
    
    if (!username || !email || !password || !publicKey) {
      res.status(400).json({ error: 'All fields are required (username, email, password, publicKey)' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username or email already in use' });
      return;
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        publicKey,
        encryptedPrivateKey: encryptedPrivateKey || null,
        keySalt: keySalt || null,
        keyIv: keyIv || null,
        signingPublicKey: signingPublicKey || null,
        encryptedSigningKey: encryptedSigningKey || null,
        signingKeyIv: signingKeyIv || null,
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
        keySalt: user.keySalt,
        keyIv: user.keyIv,
        signingPublicKey: user.signingPublicKey,
        encryptedSigningKey: user.encryptedSigningKey,
        signingKeyIv: user.signingKeyIv,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { 
      publicKey, 
      encryptedPrivateKey, 
      keySalt, 
      keyIv, 
      signingPublicKey, 
      encryptedSigningKey, 
      signingKeyIv 
    } = req.body;
    let updatedPublicKey = user.publicKey;

    // Optional migration / update of vault keys on login
    const updateData: any = {};
    if (publicKey && publicKey !== user.publicKey) {
      updateData.publicKey = publicKey;
      updatedPublicKey = publicKey;
    }
    if (encryptedPrivateKey && !user.encryptedPrivateKey) updateData.encryptedPrivateKey = encryptedPrivateKey;
    if (keySalt && !user.keySalt) updateData.keySalt = keySalt;
    if (keyIv && !user.keyIv) updateData.keyIv = keyIv;
    if (signingPublicKey && !user.signingPublicKey) updateData.signingPublicKey = signingPublicKey;
    if (encryptedSigningKey && !user.encryptedSigningKey) updateData.encryptedSigningKey = encryptedSigningKey;
    if (signingKeyIv && !user.signingKeyIv) updateData.signingKeyIv = signingKeyIv;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicKey: updatedPublicKey,
        encryptedPrivateKey: updateData.encryptedPrivateKey || user.encryptedPrivateKey,
        keySalt: updateData.keySalt || user.keySalt,
        keyIv: updateData.keyIv || user.keyIv,
        signingPublicKey: updateData.signingPublicKey || user.signingPublicKey,
        encryptedSigningKey: updateData.encryptedSigningKey || user.encryptedSigningKey,
        signingKeyIv: updateData.signingKeyIv || user.signingKeyIv,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.json({ user: null });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      res.json({ user: null });
      return;
    }
    
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.json({ user: null });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
        keySalt: user.keySalt,
        keyIv: user.keyIv,
        signingPublicKey: user.signingPublicKey,
        encryptedSigningKey: user.encryptedSigningKey,
        signingKeyIv: user.signingKeyIv,
      }
    });
  } catch (error) {
    console.error('Me query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSocketToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Generate a short-lived token specifically for Socket.IO authentication
    const socketToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1m' });
    
    res.json({ socketToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
