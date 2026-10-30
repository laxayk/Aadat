import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { bestStreak, currentStreak } from '../streaks.js';

/** pg returns DATE as a string or Date depending on the adapter; normalize to yyyy-mm-dd. */
export function toDayString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

const DAY_MS = 24 * 3600 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The client tells us its local "today" because only it knows the user's time
 * zone. But the client is not authority for the past or future: reject dates
 * more than a day ahead of the server's own clock (one day of slack covers a
 * user ahead of UTC), and reject malformed input.
 */
export function validClientDay(v: unknown): string | null {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  if (Number.isNaN(t)) return null;
  if (t > Date.now() + DAY_MS) return null;
  return v;
}

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

async function ownHabit(req: AuthedRequest, id: string) {
  const found = await db().query('select * from habit where id = $1', [id]);
  const habit = found.rows[0];
  if (!habit || habit.user_id !== req.userId) return null;
  return habit;
}

const habitBody = z.object({
  name: z.string().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4A54C4'),
  icon: z.string().min(1).max(40).default('check'),
});

habitsRouter.get('/', async (req: AuthedRequest, res) => {
  const habits = await db().query(
    'select * from habit where user_id = $1 and not archived order by created_at',
    [req.userId],
  );
  const completions = await db().query(
    `select c.habit_id, c.done_on from completion c
     join habit h on h.id = c.habit_id
     where h.user_id = $1 order by c.done_on`,
    [req.userId],
  );
  const byHabit = new Map<string, string[]>();
  for (const row of completions.rows) {
    const list = byHabit.get(row.habit_id) ?? [];
    list.push(toDayString(row.done_on));
    byHabit.set(row.habit_id, list);
  }
  const today = validClientDay(req.query.today ?? new Date().toISOString().slice(0, 10));
  if (!today) {
    res.status(400).json({ error: 'today must be a real date, yyyy-mm-dd, not in the future' });
    return;
  }
  res.json(
    habits.rows.map((h) => {
      const doneDays = byHabit.get(h.id) ?? [];
      return {
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        doneToday: doneDays.includes(today),
        currentStreak: currentStreak(doneDays, today),
        bestStreak: bestStreak(doneDays),
        doneDays,
      };
    }),
  );
});

habitsRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = habitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  const id = randomUUID();
  await db().query('insert into habit (id, user_id, name, color, icon) values ($1, $2, $3, $4, $5)', [
    id, req.userId, parsed.data.name, parsed.data.color, parsed.data.icon,
  ]);
  res.json({ id, ...parsed.data });
});

habitsRouter.put('/:id', async (req: AuthedRequest, res) => {
  const habit = await ownHabit(req, req.params.id);
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  const parsed = habitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  await db().query('update habit set name = $1, color = $2, icon = $3 where id = $4', [
    parsed.data.name, parsed.data.color, parsed.data.icon, habit.id,
  ]);
  res.json({ id: habit.id, ...parsed.data });
});

habitsRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const habit = await ownHabit(req, req.params.id);
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  await db().query('update habit set archived = true where id = $1', [habit.id]);
  res.json({ status: 'archived' });
});

const completeBody = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

habitsRouter.post('/:id/complete', async (req: AuthedRequest, res) => {
  const habit = await ownHabit(req, req.params.id);
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  const parsed = completeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Date must be yyyy-mm-dd' });
    return;
  }
  const day = validClientDay(parsed.data.date);
  if (!day) {
    res.status(400).json({ error: 'Cannot complete a habit for a future or invalid date' });
    return;
  }
  // unique (habit_id, done_on) makes a double tap or retry harmless
  await db().query(
    'insert into completion (id, habit_id, done_on) values ($1, $2, $3) on conflict (habit_id, done_on) do nothing',
    [randomUUID(), habit.id, day],
  );
  res.json({ status: 'done', date: day });
});

habitsRouter.delete('/:id/complete/:date', async (req: AuthedRequest, res) => {
  const habit = await ownHabit(req, req.params.id);
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  await db().query('delete from completion where habit_id = $1 and done_on = $2', [habit.id, req.params.date]);
  res.json({ status: 'undone', date: req.params.date });
});

habitsRouter.get('/:id/stats', async (req: AuthedRequest, res) => {
  const habit = await ownHabit(req, req.params.id);
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  const days = await db().query('select done_on from completion where habit_id = $1 order by done_on', [habit.id]);
  const doneDays = days.rows.map((r: { done_on: unknown }) => toDayString(r.done_on));
  const today = validClientDay(req.query.today ?? new Date().toISOString().slice(0, 10));
  if (!today) {
    res.status(400).json({ error: 'today must be a real date, yyyy-mm-dd, not in the future' });
    return;
  }
  res.json({
    id: habit.id,
    name: habit.name,
    color: habit.color,
    currentStreak: currentStreak(doneDays, today),
    bestStreak: bestStreak(doneDays),
    doneDays,
  });
});
