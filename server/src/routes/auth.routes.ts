// =============================================================================
// Auth Routes
// =============================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const authRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// POST /api/auth/login — exchange email+password for Supabase JWT
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required.' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      res.status(401).json({ error: error?.message ?? 'Invalid credentials.' });
      return;
    }

    // Fetch app profile
    const profile = await prisma.users.findUnique({
      where: { user_auth_id: data.user.id },
      include: { role: true }
    });

    if (!profile || profile.status !== 'active') {
      res.status(403).json({ error: profile ? `Account is ${profile.status}` : 'No profile found.' });
      return;
    }

    res.json({
      access_token: data.session.access_token,
      token_type: 'Bearer',
      expires_in: data.session.expires_in,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role.name,
        school_id: profile.school_id
      }
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me — returns current user profile (requires JWT)
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.users.findUnique({
      where: { id: req.user!.userId },
      include: { role: true, athlete: true, coach: true }
    });
    res.json(profile);
  } catch (err) { next(err); }
});
