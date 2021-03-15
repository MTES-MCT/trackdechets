import { PrismaClient } from "@prisma/client";

// Code from https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/instantiate-prisma-client#prevent-hot-reloading-from-creating-new-instances-of-prismaclient
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}
let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}
export default prisma;
