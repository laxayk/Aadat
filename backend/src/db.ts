import pg from 'pg';
import { config } from './config.js';

// Return DATE columns as raw 'yyyy-mm-dd' strings. The default parser builds a
// local-midnight Date, which shifts the day when formatted from a timezone
// ahead of UTC. Streaks depend on exact calendar days.
pg.types.setTypeParser(1082, (v: string) => v);

export type Queryable = Pick<pg.Pool, 'query'>;

let pool: pg.Pool | null = null;

/** Override in tests with an in-memory adapter. */
export function setPool(p: pg.Pool) {
  pool = p;
}

export function db(): Queryable {
  if (!pool) {
    pool = new pg.Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}
