import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const existingUser = await prisma.user.findFirst({ where: { email } as any });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword } as any,
    });

    res.status(201).json({ message: 'User registered successfully!', userId: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email } as any });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken } as any,
    });

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findFirst({ where: { id: decoded.userId } as any });

    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const logout = async (req: Request, res: Response) => {
  const { userId } = (req as any);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to logout.' });
  }
};
