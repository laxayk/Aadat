import jwt from 'jsonwebtoken';

const { sign, verify } = jwt;
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function issueToken(userId: string, email: string): string {
  return sign({ email }, config.jwtSecret, { subject: userId, expiresIn: config.jwtTtlSeconds });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }
  try {
    const payload = verify(header.slice(7), config.jwtSecret);
    req.userId = payload.sub as string;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, sign in again' });
  }
}
