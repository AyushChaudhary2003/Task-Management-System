import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/schemas';
import { AppError } from '../middleware/error.middleware';

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.status(201).json({
    message: 'Registration successful',
    user,
    accessToken,
    refreshToken,
  });
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    message: 'Login successful',
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
};

// POST /auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.userId !== payload.userId) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError(401, 'Refresh token expired');
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email });
  const newRefreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

// POST /auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  res.json({ message: 'Logged out successfully' });
};
