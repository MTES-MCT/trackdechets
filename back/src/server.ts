import { CaptureConsole } from "@sentry/integrations";
import { ApolloServer, makeExecutableSchema, ApolloError } from "apollo-server-express";
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
import { authRouter } from "./routers/auth-router";
import { downloadFileHandler } from "./common/file-download";
import { oauth2Router } from "./routers/oauth2-router";
import { prisma } from "./generated/prisma-client";
import { healthRouter } from "./health";
import { userActivationHandler } from "./users/activation";
import { typeDefs, resolvers, permissions, validations } from "./schema";
import { schemaValidation } from "./common/middlewares/schema-validation";
import { getUIBaseURL } from "./utils";
import { passportBearerMiddleware, passportJwtMiddleware } from "./auth";
import { GraphQLContext } from "./types";
import { ErrorCode } from "./common/errors";

const {
  SENTRY_DSN,
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  SESSION_NAME,
  UI_HOST,
  NODE_ENV
} = process.env;

const UI_BASE_URL = getUIBaseURL();

const shieldMiddleware = shield(permissions, { allowExternalErrors: true });

const schemaValidationMiddleware = schemaValidation(validations);

/**
 * Custom report error for sentry middleware
 * It decides whether or not the error should be captured
 */
export function reportError(res: Error | any) {
  const whiteList = [
    ErrorCode.GRAPHQL_PARSE_FAILED,
    ErrorCode.GRAPHQL_VALIDATION_FAILED,
    ErrorCode.BAD_USER_INPUT,
    ErrorCode.UNAUTHENTICATED,
    ErrorCode.FORBIDDEN
  ];

  if (res.extensions && whiteList.includes(res.extensions.code)) {
    return false;
  }
  return true;
}

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
    },
    reportError
  });

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

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
  },
  formatError: err => {
    if (
      err.extensions.code === ErrorCode.INTERNAL_SERVER_ERROR &&
      NODE_ENV !== "dev"
    ) {
      // Do not leak error for internal server error in production
      return new ApolloError("Erreur serveur", ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return err;
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

export const sess = {
  store: new RedisStore({ client: redisClient }),
  name: SESSION_NAME || "trackdechets.connect.sid",
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
