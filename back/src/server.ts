import { shield } from "graphql-shield";
import { GraphQLServer } from "graphql-yoga";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import { prisma } from "./generated/prisma-client";
import { mergePermissions } from "./utils";
import { userActivationHandler } from "./users/activation";
import { pdfHandler } from "./forms/pdf";

import { csvExportHandler } from "./forms/exports/handler";
import { sentry } from "graphql-middleware-sentry";
import { CaptureConsole } from "@sentry/integrations";
import { getUser } from "./auth";

const sentryDsn = process.env.SENTRY_DSN;

const typesArray = fileLoader(`${__dirname}/**/*.graphql`, { recursive: true });
const typeDefs = mergeTypes(typesArray, { all: true });

const resolversArray = fileLoader(`${__dirname}/**/resolvers.ts`, {
  recursive: true
});
const resolvers = mergeResolvers(resolversArray);

const permissions = fileLoader(`${__dirname}/**/permissions.ts`, {
  recursive: true
});

const shieldMiddleware = shield(mergePermissions(permissions));

/**
 * Sentry configuration
 * Capture console.error statements
 */
const sentryMiddleware = () =>
  sentry({
    config: {
      dsn: sentryDsn,
      environment: process.env.NODE_ENV,
      integrations: [new CaptureConsole({ levels: ["error"] })]
    },
    forwardErrors: true,
    withScope: (scope, error, context: any) => {
      scope.setExtra("body", context.request.body);
      scope.setExtra("origin", context.request.headers.origin);
      scope.setExtra("user-agent", context.request.headers["user-agent"]);
      scope.setTag("service", "api");
    }
  });

export const server = new GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [shieldMiddleware, ...(sentryDsn ? [sentryMiddleware()] : [])],
  context: async req => ({
    ...req,
    user: await getUser(req.request),
    prisma
  })
});

server.express.get("/ping", (_, res) => res.send("Pong!"));
server.express.get("/userActivation", userActivationHandler);
server.express.get("/pdf", pdfHandler);
server.express.get("/exports", csvExportHandler);
