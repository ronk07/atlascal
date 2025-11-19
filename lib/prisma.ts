import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  try {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    // Store in global to prevent multiple instances in serverless environments
    globalForPrisma.prisma = prismaInstance;
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw error;
  }
}

export const prisma = prismaInstance;

