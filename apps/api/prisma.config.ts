import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // process.env (no env()) para que `prisma generate` funcione sin DATABASE_URL (build de Docker).
    url: process.env.DATABASE_URL,
  },
});
