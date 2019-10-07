import { shield } from "graphql-shield";
import { GraphQLServer } from "graphql-yoga";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import { prisma } from "./generated/prisma-client";
import { merge } from "./utils";
import { userActivationHandler } from "./users/activation";
import { pdfHandler } from "./forms/pdf";
import { initSubsriptions } from "./subscriptions";
import { csvExportHandler } from "./forms/exports/handler";
import { sentry } from "graphql-middleware-sentry";
import { CaptureConsole } from "@sentry/integrations";

const port = process.env.port || 80;
const isProd = process.env.NODE_ENV === "production";
const sentryDsn = process.env.SENTRY_DSN;

const typesArray = fileLoader(`${__dirname}/**/*.graphql`, { recursive: true });
const typeDefs = mergeTypes(typesArray, { all: true });

const resolversArray = fileLoader(`${__dirname}/**/resolvers.ts`, {
  recursive: true
});
const resolvers = mergeResolvers(resolversArray);

const rulesArray = fileLoader(`${__dirname}/**/rules.ts`, { recursive: true });
const permissions = shield(rulesArray.reduce((prev, cur) => merge(prev, cur)));

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
    }
  });

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [...(sentryDsn ? [sentryMiddleware()] : [])],
  context: request => ({
    ...request,
    prisma
  })
});

server.express.get("/ping", (_, res) => res.send("Pong!"));
server.express.get("/userActivation", userActivationHandler);
server.express.get("/pdf", pdfHandler);
server.express.get("/exports", csvExportHandler);
server.start({ port, debug: !isProd }, () =>
  console.log(`Server is running on port ${port}`)
);

initSubsriptions();
