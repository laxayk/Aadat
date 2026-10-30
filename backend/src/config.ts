import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8081),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://aadat:aadat@localhost:5432/aadat',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me-0123456789abcdef',
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 7 * 24 * 3600),
};
