// =============================================================================
// Global Error Handler Middleware
// Catches all thrown errors from controllers and returns structured JSON.
// Prevents raw stack traces from leaking to clients in production.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Zod validation error (bad request body)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = Unique constraint violation
    if (err.code === 'P2002') {
      res.status(409).json({
        error: `Duplicate record: a row with this value already exists (${err.meta?.target})`
      });
      return;
    }
    // P2003 = Foreign key constraint failure
    if (err.code === 'P2003') {
      res.status(409).json({
        error: `Referential integrity error: a related record does not exist (${err.meta?.field_name})`
      });
      return;
    }
    // P2025 = Record not found
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Record not found.' });
      return;
    }
  }

  // Unknown error — log internally, return generic 500
  console.error('[FARE-ERP API Error]', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : (err instanceof Error ? err.message : String(err))
  });
}
