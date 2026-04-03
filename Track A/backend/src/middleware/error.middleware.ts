import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    res.status(409).json({ message: 'A record with this value already exists' });
    return;
  }

  // Prisma record not found
  if ((err as any).code === 'P2025') {
    res.status(404).json({ message: 'Record not found' });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
