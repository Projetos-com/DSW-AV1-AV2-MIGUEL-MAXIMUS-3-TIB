// Instância única do Prisma Client (Prisma 7 usa um "driver adapter" para o PostgreSQL)
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { env } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });
