import { Prisma, User } from "./generated/prisma-client";

export interface Context {
  user: User;
  prisma: Prisma;
  request: any;
}
