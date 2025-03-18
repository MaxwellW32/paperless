import { defineConfig } from 'drizzle-kit';
require('dotenv').config({ path: ".env.local" })

export default defineConfig({
    out: './drizzle',
    schema: './db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});