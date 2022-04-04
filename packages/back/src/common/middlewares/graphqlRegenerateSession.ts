import { Request, Response, NextFunction } from "express";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import { graphqlSpecificQueryHandlerMiddleware } from "./graphqlSpecificQueryHandler";

type GqlQueryKey = keyof MutationResolvers;

export function graphqlRegenerateSessionMiddleware(query: GqlQueryKey) {
  return graphqlSpecificQueryHandlerMiddleware(
    query,
    function (req: Request, res: Response, next: NextFunction) {
      if (!req.session) {
        throw new Error(
          "The `graphqlRegenerateSessionMiddleware` middleware must be called after the `session` middleware."
        );
      }

      const currentSession = req.session;
      req.session.regenerate(regenerateError => {
        if (regenerateError) {
          res.status(500).send("Error while regenerating the session.");
        }

        Object.assign(req.session, currentSession);
        req.session.save(saveError => {
          if (saveError) {
            res
              .status(500)
              .send("Error while saving session after regenerate.");
          }

          next();
        });
      });
    }
  );
}
