import { Request, Response } from "express";
import { createEventsDataLoaders } from "./activity-events/dataloader";
import { GqlInfo } from "./common/plugins/gqlInfosPlugin";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createFormDataLoaders } from "./forms/dataloader";
import { createBsdaDataLoaders } from "./bsda/dataloader";
import { createUserDataLoaders } from "./users/dataloaders";
import "express-session";

export type AppDataloaders = ReturnType<typeof createUserDataLoaders> &
  ReturnType<typeof createCompanyDataLoaders> &
  ReturnType<typeof createFormDataLoaders> &
  ReturnType<typeof createBsdaDataLoaders> &
  ReturnType<typeof createEventsDataLoaders>;

export type GraphQLContext = {
  req: Request;
  res: Response;
} & {
  user: Express.User | null;
  dataloaders: AppDataloaders;
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

type Cons<H, T> = T extends readonly any[]
  ? ((h: H, ...t: T) => void) extends (...r: infer R) => void
    ? R
    : never
  : never;
type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[]
];

export type Paths<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?:
        | [K]
        | (Paths<T[K], Prev[D]> extends infer P
            ? P extends []
              ? never
              : Cons<K, P>
            : never);
    }[keyof T]
  : [];

export type Leaves<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Cons<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : [];

declare module "express-session" {
  interface SessionData {
    warningMessage?: string;
    impersonatedUserId?: string;
    impersonationStartsAt?: number;
  }
}

declare module "express" {
  interface Request {
    gqlInfos?: GqlInfo[];
  }
}
