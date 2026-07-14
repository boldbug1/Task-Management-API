import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createUser, getUserByUsername } from '../database/authQueries.js';

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten().fieldErrors });
  }

  const { username, password } = parse.data;

  try {
    const user = await createUser(username, password);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '24h' });
    res.status(201).json({ token, user });
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten().fieldErrors });
  }

  const { username, password } = parse.data;

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, created_at: user.created_at } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
