import { CaptureConsole } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import {
  ApolloError,
  ApolloServer,
  makeExecutableSchema,
  UserInputError
} from "apollo-server-express";
import { json, urlencoded } from "body-parser";
import redisStore from "connect-redis";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import depthLimit from "graphql-depth-limit";
import { applyMiddleware } from "graphql-middleware";
import passport from "passport";
import RateLimitRedisStore from "rate-limit-redis";
import prisma from "./prisma";
import { passportBearerMiddleware, passportJwtMiddleware } from "./auth";
import { ErrorCode } from "./common/errors";
import { downloadFileHandler } from "./common/file-download";
import errorHandler from "./common/middlewares/errorHandler";
import graphqlBodyParser from "./common/middlewares/graphqlBodyParser";
import loggingMiddleware from "./common/middlewares/loggingMiddleware";
import { redisClient } from "./common/redis";
import { authRouter } from "./routers/auth-router";
import { oauth2Router } from "./routers/oauth2-router";
import { resolvers, typeDefs } from "./schema";
import { userActivationHandler } from "./users/activation";
import { getUIBaseURL } from "./utils";
import sentryReporter from "./common/plugins/sentryReporter";

const {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  SESSION_NAME,
  UI_HOST,
  NODE_ENV
} = process.env;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    integrations: [new CaptureConsole({ levels: ["error"] })]
  });
}

const UI_BASE_URL = getUIBaseURL();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

export const schemaWithMiddleware = applyMiddleware(schema);

// GraphQL endpoint
const graphQLPath = "/";

export const server = new ApolloServer({
  schema: schemaWithMiddleware,
  introspection: true, // used to enable the playground in production
  playground: true, // used to enable the playground in production
  validationRules: [depthLimit(10)],
  context: async ctx => {
    return {
      ...ctx,
      // req.user is made available by passport
      user: ctx.req?.user ?? null,
      prisma
    };
  },
  formatError: err => {
    // Catch Yup `ValidationError` and throw a `UserInputError` instead of an `InternalServerError`
    if (err.extensions.exception?.name === "ValidationError") {
      return new UserInputError(err.extensions.exception.errors.join("\n"));
    }
    if (
      err.extensions.code === ErrorCode.INTERNAL_SERVER_ERROR &&
      NODE_ENV === "production"
    ) {
      // Workaround for graphQL validation error displayed as internal server error
      // when graphQL variables are of of invalid type
      // See: https://github.com/apollographql/apollo-server/issues/3498
      if (err.message && err.message.startsWith(`Variable "`)) {
        err.extensions.code = "GRAPHQL_VALIDATION_FAILED";
        return err;
      }
      // Do not leak error for internal server error in production
      const sentryId = (err?.originalError as any)?.sentryId;
      const defaultErrorMessage =
        "Erreur serveur" + (sentryId ? ` : Rapport d'erreur ${sentryId}` : "");
      return new ApolloError(
        defaultErrorMessage,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return err;
  },
  plugins: [...(SENTRY_DSN ? [sentryReporter] : [])]
});

export const app = express();

if (SENTRY_DSN) {
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 1000;
app.use(
  rateLimit({
    message: `Quota de ${MAX_REQUESTS_PER_WINDOW} requêtes par minute excédée pour cette adresse IP, merci de réessayer plus tard.`,
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    max: MAX_REQUESTS_PER_WINDOW,
    store: new RateLimitRedisStore({
      client: redisClient,
      expiry: RATE_LIMIT_WINDOW_SECONDS
    })
  })
);

/**
 * parse application/x-www-form-urlencoded
 * used when submitting login form
 */
app.use(urlencoded({ extended: false }));

app.use(json());

// allow application/graphql header
app.use(graphqlBodyParser);

// logging middleware
app.use(loggingMiddleware(graphQLPath));

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

export const sess: session.SessionOptions = {
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

app.get("/exports", (_, res) =>
  res
    .status(410)
    .send("Route dépréciée, utilisez la query GraphQL `formsRegister`")
);

// Apply passport auth middlewares to the graphQL endpoint
app.use(graphQLPath, passportBearerMiddleware, passportJwtMiddleware);

/**
 * Wire up ApolloServer to /
 * UI_BASE_URL is explicitly set in the origin list
 * to avoid "Credentials is not supported if the CORS header ‘Access-Control-Allow-Origin’ is ‘*’"
 * See https://developer.mozilla.org/fr/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
 */
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

if (SENTRY_DSN) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);
