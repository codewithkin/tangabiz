import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Create Prisma client with Accelerate extension
const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate());
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
