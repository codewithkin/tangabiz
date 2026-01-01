import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
