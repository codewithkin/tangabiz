import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@tangabiz/env/server";
import { PrismaClient } from "@prisma/client";

// Create Prisma client with PostgreSQL adapter
const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Use singleton pattern to prevent multiple instances during development
export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export type Database = typeof db;