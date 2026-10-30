import pg from 'pg';
import { config } from './config.js';

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
