import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

<<<<<<< HEAD
export const prisma = globalForPrisma.prisma ?? new PrismaClient({});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
=======
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // opcional: si quieres ver queries
    // log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
>>>>>>> main
