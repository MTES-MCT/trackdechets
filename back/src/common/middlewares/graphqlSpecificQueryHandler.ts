import { Request, Response, NextFunction } from "express";
import {
  MutationResolvers,
  QueryResolvers
} from "../../generated/graphql/types";

type AllowedQueries = keyof QueryResolvers | keyof MutationResolvers;

export function graphqlSpecificQueryHandlerMiddleware(
  query: AllowedQueries,
  middleware
) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.gqlInfos) {
      console.warn(
        `The "gqlInfos" is not set on the request object. The "graphqlQueryParser" middleware must be called before this one, otherwise queries won't be rate limited.`
      );
      return next();
    }

    if (!req.gqlInfos.map(info => info.name).includes(query)) {
      return next();
    }

    return middleware(req, res, next);
  };
}
