// Export the Prisma client from the centralized db package
export { default as db } from "@tangabiz/db";
export type { PrismaClient as Database } from "@prisma/client";
