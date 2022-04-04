import { User, Company } from "@prisma/client";

export type FullUser = User & { companies: Company[] };
