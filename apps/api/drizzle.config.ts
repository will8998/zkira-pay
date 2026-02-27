import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://zkira:zkira_s3cure_2026!@localhost:5432/zkira',
  },
  verbose: true,
  strict: true,
});