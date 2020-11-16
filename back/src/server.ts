import { CaptureConsole } from "@sentry/integrations";
import {
  ApolloServer,
  makeExecutableSchema,
  ApolloError,
  UserInputError
} from "apollo-server-express";
import express from "express";
import passport from "passport";
import session from "express-session";
import rateLimit from "express-rate-limit";
import RateLimitRedisStore from "rate-limit-redis";
import redisStore from "connect-redis";
import depthLimit from "graphql-depth-limit";
import bodyParser from "body-parser";
import cors from "cors";
import graphqlBodyParser from "./common/middlewares/graphqlBodyParser";
import { applyMiddleware } from "graphql-middleware";
import { sentry } from "graphql-middleware-sentry";
import { authRouter } from "./routers/auth-router";
import { downloadFileHandler } from "./common/file-download";
import { oauth2Router } from "./routers/oauth2-router";
import { prisma } from "./generated/prisma-client";
import { userActivationHandler } from "./users/activation";
import { typeDefs, resolvers } from "./schema";
import { getUIBaseURL } from "./utils";
import { passportBearerMiddleware, passportJwtMiddleware } from "./auth";
import { GraphQLContext } from "./types";
import { ErrorCode } from "./common/errors";
import { redisClient } from "./common/redis";
import loggingMiddleware from "./common/middlewares/loggingMiddleware";
import errorHandler from "./common/middlewares/errorHandler";

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
  ...[...(SENTRY_DSN ? [sentryMiddleware()] : [])]
);

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
      // Do not leak error for internal server error in production
      return new ApolloError("Erreur serveur", ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return err;
  }
});

export const app = express();

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
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

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

// TODO Remove
app.get("/pdf", (_, res) =>
  res.status(410).send("Route dépréciée, utilisez la query GraphQL `formPdf`")
);
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

// error handler
app.use(errorHandler);
