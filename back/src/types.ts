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
