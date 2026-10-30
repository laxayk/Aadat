import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPool } from '../db.js';
import { createApp } from '../app.js';

const app = createApp();

async function register(email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, displayName: 'Test', password: 'password123' });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  const mem = newDb();
  const pg = mem.adapters.createPg();
  setPool(new pg.Pool());
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');
  await setPoolAndMigrate(pg);
  async function setPoolAndMigrate(p: typeof pg) {
    const pool = new p.Pool();
    setPool(pool);
    await pool.query(readFileSync(join(dir, '001_init.sql'), 'utf8'));
  }
});

describe('habitcanvas api', () => {
  it('register, login, and wrong password refused', async () => {
    const token = await register('a@example.com');
    expect(token).toBeTruthy();

    const dup = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@example.com', displayName: 'Dup', password: 'password123' });
    expect(dup.status).toBe(409);

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'nope-nope' });
    expect(wrong.status).toBe(401);
  });

  it('habit CRUD is scoped to the owner', async () => {
    const mine = await register('owner@example.com');
    const other = await register('other@example.com');

    const created = await request(app)
      .post('/api/habits')
      .set(auth(mine))
      .send({ name: 'Read 20 min', color: '#2E9E5B' });
    expect(created.status).toBe(200);
    const id = created.body.id;

    const notFound = await request(app).put(`/api/habits/${id}`).set(auth(other)).send({ name: 'x' });
    expect(notFound.status).toBe(404);

    const list = await request(app).get('/api/habits?today=2026-10-30').set(auth(mine));
    expect(list.body).toHaveLength(1);
    expect(list.body[0].doneToday).toBe(false);
  });

  it('complete is idempotent and feeds streaks', async () => {
    const token = await register('streak@example.com');
    const created = await request(app).post('/api/habits').set(auth(token)).send({ name: 'Workout' });
    const id = created.body.id;

    for (const date of ['2026-10-28', '2026-10-29', '2026-10-29']) {
      const res = await request(app).post(`/api/habits/${id}/complete`).set(auth(token)).send({ date });
      expect(res.status).toBe(200);
    }
    const stats = await request(app).get(`/api/habits/${id}/stats?today=2026-10-30`).set(auth(token));
    expect(stats.body.doneDays).toHaveLength(2);
    expect(stats.body.currentStreak).toBe(2);

    await request(app).delete(`/api/habits/${id}/complete/2026-10-29`).set(auth(token));
    const after = await request(app).get(`/api/habits/${id}/stats?today=2026-10-30`).set(auth(token));
    expect(after.body.currentStreak).toBe(0);
  });

  it('rejects bad dates and unauthenticated calls', async () => {
    const token = await register('dates@example.com');
    const created = await request(app).post('/api/habits').set(auth(token)).send({ name: 'Journal' });
    const bad = await request(app)
      .post(`/api/habits/${created.body.id}/complete`)
      .set(auth(token))
      .send({ date: '30/10/2026' });
    expect(bad.status).toBe(400);

    const unauth = await request(app).get('/api/habits');
    expect(unauth.status).toBe(401);
  });
});

describe('client date hardening', () => {
  it('rejects future completions and forged today', async () => {
    const token = await register('future@example.com');
    const created = await request(app).post('/api/habits').set(auth(token)).send({ name: 'Meditate' });
    const id = created.body.id;

    const future = await request(app)
      .post(`/api/habits/${id}/complete`)
      .set(auth(token))
      .send({ date: '2999-01-01' });
    expect(future.status).toBe(400);

    const badToday = await request(app).get(`/api/habits/${id}/stats?today=2999-01-01`).set(auth(token));
    expect(badToday.status).toBe(400);

    const weirdToday = await request(app).get('/api/habits?today=not-a-date').set(auth(token));
    expect(weirdToday.status).toBe(400);
  });
});
