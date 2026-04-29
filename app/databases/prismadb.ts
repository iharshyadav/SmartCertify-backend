import pkg from "@prisma/client";

const PrismaClient = (pkg as any).PrismaClient;

declare global {
  var prisma: any;
}

let prisma: any;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;