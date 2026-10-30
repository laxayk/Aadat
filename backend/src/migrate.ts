import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

export async function migrate() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db().query(readFileSync(join(dir, file), 'utf8'));
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  migrate().then(() => {
    console.log('migrations applied');
    process.exit(0);
  });
}
