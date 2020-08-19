import { User, Company } from "../generated/prisma-client";

export type FullUser = User & { companies: Company[] };
