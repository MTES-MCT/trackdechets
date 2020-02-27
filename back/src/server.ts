import { CaptureConsole } from "@sentry/integrations";
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import * as express from "express";
import * as passport from "passport";
import * as session from "express-session";
import * as redisStore from "connect-redis";
import * as Redis from "ioredis";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import graphqlBodyParser from "./common/middlewares/graphqlBodyParser";
import { applyMiddleware } from "graphql-middleware";
import { sentry } from "graphql-middleware-sentry";
import { shield } from "graphql-shield";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import { authRouter } from "./routers/auth-router";
import { downloadFileHandler } from "./common/file-download";
import { oauth2Router } from "./routers/oauth2-router";
import { prisma } from "./generated/prisma-client";
import { healthRouter } from "./health";
import { userActivationHandler } from "./users/activation";
import {
  schemaValidation,
  mergeValidationRules
} from "./common/middlewares/schema-validation";
import { mergePermissions, getUIBaseURL } from "./utils";
import { passportBearerMiddleware, passportJwtMiddleware } from "./auth";
import { GraphQLContext } from "./types";

const {
  SENTRY_DSN,
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  UI_HOST,
  NODE_ENV
} = process.env;

const UI_BASE_URL = getUIBaseURL();

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

const schemas = fileLoader(`${__dirname}/**/schema-validation.ts`, {
  recursive: true
});
const schemaValidationMiddleware = schemaValidation(
  mergeValidationRules(schemas)
);

/**
 * Sentry configuration
 * Capture console.error statements
 */
const sentryMiddleware = () =>
  sentry<GraphQLContext>({
    config: {
      dsn: SENTRY_DSN,
      environment: NODE_ENV,
      integrations: [new CaptureConsole({ levels: ["error"] })]
    },
    forwardErrors: true,
    withScope: (scope, error, context) => {
      const reqUser = !!context.user ? context.user.email : "anonymous";
      scope.setUser({
        email: reqUser
      });

      scope.setExtra("body", context.req.body);
      scope.setExtra("origin", context.req.headers.origin);
      scope.setExtra("user-agent", context.req.headers["user-agent"]);
      scope.setExtra("ip", context.req.headers["x-real-ip"]);
      scope.setTag("service", "api");
    }
  });

export const schema = makeExecutableSchema({ typeDefs, resolvers });
export const schemaWithMiddleware = applyMiddleware(
  schema,
  ...[
    shieldMiddleware,
    ...(SENTRY_DSN ? [sentryMiddleware()] : []),
    schemaValidationMiddleware
  ]
);

export const server = new ApolloServer({
  schema: schemaWithMiddleware,
  introspection: true, // used to enable the playground in production
  playground: true, // used to enable the playground in production
  context: async ctx => {
    return {
      ...ctx,
      // req.user is made available by passport
      ...{ user: !!ctx.req ? ctx.req.user : null },
      prisma
    };
  }
});

export const app = express();

/**
 * parse application/x-www-form-urlencoded
 * used when submitting login form
 */
app.use(bodyParser.urlencoded({ extended: false }));

// allow application/graphql header
app.use(graphqlBodyParser);

/**
 * Set the following headers for cross-domain cookie
 * Access-Control-Allow-Credentials: true
 * Access-Control-Allow-Origin: $UI_DOMAIN
 */
app.use(
  cors({
    origin: UI_BASE_URL,
    credentials: true
  })
);

// configure session for passport local strategy
const RedisStore = redisStore(session);
const redisClient = new Redis({ host: "redis" });

const sess = {
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    domain: SESSION_COOKIE_HOST || UI_HOST,
    maxAge: 24 * 3600 * 1000
  }
};

if (SESSION_COOKIE_SECURE === "true") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());

// Load passport configuration
import("./auth");

// authentification routes used by td-ui (/login /logout, /isAuthenticated)
app.use(authRouter);
app.use(oauth2Router);

app.get("/ping", (_, res) => res.send("Pong!"));
app.get("/userActivation", userActivationHandler);
app.get("/download", downloadFileHandler);
app.use("/health", healthRouter);

// GraphQL endpoint
const graphQLPath = "/";

// Apply passport auth middlewares to the graphQL endpoint
app.use(graphQLPath, passportBearerMiddleware, passportJwtMiddleware);

/**
 * Wire up ApolloServer to /
 * UI_BASE_URL is explicitly set in the origin list
 * to avoid "Credentials is not supported if the CORS header ‘Access-Control-Allow-Origin’ is ‘*’"
 * See https://developer.mozilla.org/fr/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
 */

// TODO Remove
app.get("/pdf", (_, res) =>
  res.status(410).send("Route dépréciée, utilisez la query GraphQL `formPdf`")
);
app.get("/exports", (_, res) =>
  res
    .status(410)
    .send("Route dépréciée, utilisez la query GraphQL `formsRegister`")
);

server.applyMiddleware({
  app,
  cors: {
    origin: [UI_BASE_URL, "*"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
  },
  path: graphQLPath
});
