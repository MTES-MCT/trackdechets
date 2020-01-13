import { CaptureConsole } from "@sentry/integrations";
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as session from "express-session";
import { applyMiddleware } from "graphql-middleware";
import { sentry } from "graphql-middleware-sentry";
import { shield } from "graphql-shield";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";

import { getUser } from "./auth";
import { csvExportHandler } from "./forms/exports/handler";
import { pdfHandler } from "./forms/pdf";
import { prisma } from "./generated/prisma-client";
import { healthRouter } from "./health";
import { userActivationHandler } from "./users/activation";
import { mergePermissions } from "./utils";
import { renewSecurityCode } from "./companies/mutations";

const passport = require("passport");
const cors = require("cors");

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

// authenticate with passport bearer and JWT strategy
// if not user already set in session
// (not sure how it works exactly)
const passportMiddleware = (req, _) => {
  if (!req.user) {
    passport.authenticate(["bearer", "JWT"], { session: false });
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithMiddleware = applyMiddleware(
  schema,
  ...[
    // passportMiddleware,
    shieldMiddleware,
    ...(sentryDsn ? [sentryMiddleware()] : [])
  ]
);

export const server = new ApolloServer({
  schema: schemaWithMiddleware,
  introspection: true, // used to enable the playground in production
  playground: true, // used to enable the playground in production
  context: async ctx => ({
    ...ctx,
    // passport will make user available on the request
    user: ctx.req.user,
    prisma
  })
});

export const app = express();

// used to issue POST /login from td-ui
// need additionnal config to restrict domain
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    // not working yet, we need to tweak this config
    // to work with cross origin cookie
    cookie: { domain: "ui-td.local", sameSite: "none" }
    // we can use Redis as persistent session store
    // store: new RedisStore({ client: redisClient }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

// load passport configuration
require("./authConfig");

app.get("/ping", (_, res) => res.send("Pong!"));
app.get("/userActivation", userActivationHandler);
app.get("/pdf", pdfHandler);
app.get("/exports", csvExportHandler);
app.use("/health", healthRouter);

// move login outside of graphQL schema
// if successful a persistent session will
// be set and the user will be made available in req.user
app.post("/login", passport.authenticate("local"), (req, res) => {
  return res.send("success");
});

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
