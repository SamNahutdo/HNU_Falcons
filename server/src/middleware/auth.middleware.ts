// =============================================================================
// Authentication Middleware
// Validates Supabase JWT tokens and attaches the decoded payload to req.user.
// Also resolves the caller's application role from the users table via Prisma.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/prisma';

// Extend Express Request to carry the authenticated user context
export type UserRole = 'admin' | 'staff' | 'coach' | 'student';

export interface AuthUser {
  authUid: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  schoolId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Supabase client for JWT verification only (uses anon key — read-only auth ops)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ─── authenticate (JWT validation + role resolution) ────────────────────────
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header. Expected: Bearer <token>' });
    return;
  }

  const token = authHeader.substring(7);

  // 1. Verify JWT with Supabase Auth service
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired access token.' });
    return;
  }

  // 2. Resolve application user profile + role via Prisma ORM
  const appUser = await prisma.users.findUnique({
    where: { user_auth_id: user.id },
    include: { role: true }
  });

  if (!appUser) {
    res.status(403).json({
      error: 'No application profile found for this auth account. Contact your administrator.'
    });
    return;
  }

  if (appUser.status !== 'active') {
    res.status(403).json({
      error: `Your account is ${appUser.status}. Contact your administrator.`
    });
    return;
  }

  // 3. Attach to req.user for downstream controllers
  req.user = {
    authUid: user.id,
    userId: appUser.id,
    email: appUser.email,
    fullName: appUser.full_name,
    role: appUser.role.name as UserRole,
    schoolId: appUser.school_id ?? null
  };

  next();
}

// ─── requireRole (role-based authorization guard) ────────────────────────────
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `FORBIDDEN: This action requires one of these roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
      return;
    }
    next();
  };
}
