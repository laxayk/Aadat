import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { issueToken } from '../auth.js';

export const authRouter = Router();

const registerBody = z.object({
  email: z.string().email().max(320),
  displayName: z.string().min(1).max(120),
  password: z.string().min(8).max(72),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const existing = await db().query('select id from app_user where email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }
  const id = randomUUID();
  const hash = bcrypt.hashSync(parsed.data.password, 10);
  await db().query(
    'insert into app_user (id, email, display_name, password_hash) values ($1, $2, $3, $4)',
    [id, email, parsed.data.displayName, hash],
  );
  res.json({ token: issueToken(id, email), userId: id, email, displayName: parsed.data.displayName });
});

const loginBody = z.object({ email: z.string().email(), password: z.string() });

authRouter.post('/login', async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const found = await db().query('select * from app_user where email = $1', [email]);
  const user = found.rows[0];
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }
  res.json({
    token: issueToken(user.id, user.email),
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
  });
});
