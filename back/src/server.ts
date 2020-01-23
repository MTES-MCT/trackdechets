import { CaptureConsole } from "@sentry/integrations";
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import * as express from "express";
import { applyMiddleware } from "graphql-middleware";
import { sentry } from "graphql-middleware-sentry";
import { shield } from "graphql-shield";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import * as bodyParser from "body-parser-graphql";

import { getUser } from "./auth";
import { csvExportHandler } from "./forms/exports/handler";
import { pdfHandler } from "./forms/pdf";
import { prisma } from "./generated/prisma-client";
import { healthRouter } from "./health";
import { userActivationHandler } from "./users/activation";
import { mergePermissions } from "./utils";

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
    withScope: (scope, error, context: ExpressContext) => {
      scope.setExtra("body", context.req.body);
      scope.setExtra("origin", context.req.headers.origin);
      scope.setExtra("user-agent", context.req.headers["user-agent"]);
      scope.setTag("service", "api");
    }
  });

const schema = makeExecutableSchema({ typeDefs, resolvers });
export const schemaWithMiddleware = applyMiddleware(
  schema,
  ...[shieldMiddleware, ...(sentryDsn ? [sentryMiddleware()] : [])]
);

export const server = new ApolloServer({
  schema: schemaWithMiddleware,
  introspection: true, // used to enable the playground in production
  playground: true, // used to enable the playground in production
  context: async ctx => ({
    ...ctx,
    user: await getUser(ctx.req),
    prisma
  })
});

export const app = express();
app.use(bodyParser.graphql()); // allow application/graphql header

app.get("/ping", (_, res) => res.send("Pong!"));
app.get("/userActivation", userActivationHandler);
app.get("/pdf", pdfHandler);
app.get("/exports", csvExportHandler);
app.use("/health", healthRouter);
 app.use(bodyParser.graphql());
server.applyMiddleware({
  app,
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  path: "/"
});
