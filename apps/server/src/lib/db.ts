// Export the Prisma client from the centralized db package
import prisma from "@tangabiz/db";
export { prisma as db };
export type { PrismaClient as Database } from "@prisma/client";