import "./tracer";

import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  ApolloError,
  ApolloServer,
  UserInputError
} from "apollo-server-express";
import redisStore from "connect-redis";
import cors from "cors";
import express, { json, static as serveStatic, urlencoded } from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import depthLimit from "graphql-depth-limit";
import helmet from "helmet";
import passport from "passport";
import path from "path";
import RateLimitRedisStore from "rate-limit-redis";
import { passportBearerMiddleware, passportJwtMiddleware } from "./auth";
import { ErrorCode } from "./common/errors";
import errorHandler from "./common/middlewares/errorHandler";
import { graphqlBatchLimiterMiddleware } from "./common/middlewares/graphqlBatchLimiter";
import graphqlBodyParser from "./common/middlewares/graphqlBodyParser";
import { graphqlQueryParserMiddleware } from "./common/middlewares/graphqlQueryParser";
import { graphqlRateLimiterMiddleware } from "./common/middlewares/graphqlRatelimiter";
import { graphqlRegenerateSessionMiddleware } from "./common/middlewares/graphqlRegenerateSession";
import loggingMiddleware from "./common/middlewares/loggingMiddleware";
import { graphiqlLandingPagePlugin } from "./common/plugins/graphiql";
import sentryReporter from "./common/plugins/sentryReporter";
import { redisClient } from "./common/redis";
import { initSentry } from "./common/sentry";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { bullBoardPath, serverAdapter } from "./queue/bull-board";
import { authRouter } from "./routers/auth-router";
import { downloadRouter } from "./routers/downloadRouter";
import { oauth2Router } from "./routers/oauth2-router";
import { resolvers, typeDefs } from "./schema";
import { userActivationHandler } from "./users/activation";
import { createUserDataLoaders } from "./users/dataloaders";
import { getUIBaseURL } from "./utils";

const {
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  SESSION_NAME,
  UI_HOST,
  MAX_REQUESTS_PER_WINDOW = "1000",
  NODE_ENV
} = process.env;

const Sentry = initSentry();

const UI_BASE_URL = getUIBaseURL();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// GraphQL endpoint
const graphQLPath = "/";

export const server = new ApolloServer({
  schema,
  introspection: true, // used to enable the playground in production
  validationRules: [depthLimit(10)],
  context: async ctx => {
    return {
      ...ctx,
      // req.user is made available by passport
      user: ctx.req?.user ?? null,
      dataloaders: { ...createUserDataLoaders(), ...createCompanyDataLoaders() }
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
      return new ApolloError(
        sentryId
          ? `Erreur serveur : rapport d'erreur ${sentryId}`
          : "Erreur serveur",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return err;
  },
  plugins: [graphiqlLandingPagePlugin(), ...(Sentry ? [sentryReporter] : [])]
});

export const app = express();

if (Sentry) {
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const maxrequestPerWindows = parseInt(MAX_REQUESTS_PER_WINDOW, 10);
const store = new RateLimitRedisStore({
  client: redisClient,
  expiry: RATE_LIMIT_WINDOW_SECONDS
});

app.use(
  rateLimit({
    message: `Quota de ${maxrequestPerWindows} requêtes par minute excédé pour cette adresse IP, merci de réessayer plus tard.`,
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    max: maxrequestPerWindows,
    store
  })
);

app.use(
  helmet({
    hsts: false, // Auto injected by Scalingo
    // Because of the GraphQL playground we have to override the default
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: [
          "'self'",
          "https:",
          "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"
        ],
        connectSrc: [process.env.API_HOST],
        formAction: ["self"],
        ...(NODE_ENV === "production" && { upgradeInsecureRequests: [] })
      }
    }
  })
);

/**
 * parse application/x-www-form-urlencoded
 * used when submitting login form
 */
app.use(urlencoded({ extended: false }));

app.use(json());

// allow application/graphql header
app.use(graphQLPath, graphqlBodyParser);
app.use(graphQLPath, graphqlQueryParserMiddleware());
app.use(graphQLPath, graphqlBatchLimiterMiddleware());
app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("resendInvitation", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 3 * 1000,
    maxRequestsPerWindow: 10, // 10 requests each 3 minutes
    store
  })
);
app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("createPasswordResetRequest", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    maxRequestsPerWindow: 1,
    store
  })
);

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
app.use(graphQLPath, graphqlRegenerateSessionMiddleware("changePassword"));

// authentification routes used by td-ui (/login /logout, /isAuthenticated)
app.use(authRouter);
app.use(oauth2Router);

app.get("/ping", (_, res) => res.send("Pong!"));

app.get("/userActivation", userActivationHandler);
app.get("/download", downloadRouter);

app.get("/exports", (_, res) =>
  res
    .status(410)
    .send("Route dépréciée, utilisez la query GraphQL `formsRegister`")
);

app.use(
  "/graphiql",
  serveStatic(path.join(__dirname, "common/plugins/graphiql/assets"))
);

function ensureLoggedInAndAdmin() {
  // check passeport populated user is admin
  return function (req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req?.user?.isAdmin) {
      return res.status(404).send("Not found");
    }

    next();
  };
}
app.use(bullBoardPath, ensureLoggedInAndAdmin(), serverAdapter.getRouter());

// Apply passport auth middlewares to the graphQL endpoint
app.use(graphQLPath, passportBearerMiddleware, passportJwtMiddleware);

// Returns 404 Not Found for every routes not handled by apollo
app.use((req, res, next) => {
  const healthCheckPath = "/.well-known/apollo/server-health";
  if (![graphQLPath, healthCheckPath].includes(req.path)) {
    return res.status(404).send("Not found");
  }
  next();
});

if (Sentry) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

export async function startApolloServer() {
  await server.start();

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
}
