import "./tracer";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { expressMiddleware } from "@apollo/server/express4";
import redisStore from "connect-redis";
import cors from "cors";
import express, { json, static as serveStatic, urlencoded } from "express";
import session from "express-session";
import depthLimit from "graphql-depth-limit";
import helmet from "helmet";
import passport from "passport";
import path from "path";
import { passportBearerMiddleware } from "./auth";
import { ROAD_CONTROL_SLUG } from "./common/constants";
import { ErrorCode, UserInputError } from "./common/errors";
import errorHandler from "./common/middlewares/errorHandler";
import { graphqlBatchLimiterMiddleware } from "./common/middlewares/graphqlBatchLimiter";
import { graphqlBodyParser } from "./common/middlewares/graphqlBodyParser";
import { graphqlQueryParserMiddleware } from "./common/middlewares/graphqlQueryParser";
import { graphqlRateLimiterMiddleware } from "./common/middlewares/graphqlRatelimiter";
import { graphqlRegenerateSessionMiddleware } from "./common/middlewares/graphqlRegenerateSession";
import loggingMiddleware from "./common/middlewares/loggingMiddleware";
import { rateLimiterMiddleware } from "./common/middlewares/rateLimiter";
import { timeoutMiddleware } from "./common/middlewares/timeout";
import { graphqlQueryMergingLimiter } from "./common/middlewares/graphqlQueryMergingLimiter";
import { graphiqlLandingPagePlugin } from "./common/plugins/graphiql";
import sentryReporter from "./common/plugins/sentryReporter";
import { redisClient } from "./common/redis";
import { initSentry } from "./common/sentry";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createEventsDataLoaders } from "./activity-events/dataloader";
import { createFormDataLoaders } from "./forms/dataloader";
import { bullBoardPath, serverAdapter } from "./queue/bull-board";
import { authRouter } from "./routers/auth-router";
import { downloadRouter } from "./routers/downloadRouter";
import { oauth2Router } from "./routers/oauth2-router";
import { oidcRouter } from "./routers/oidc-router";
import { roadControlPdfHandler } from "./routers/roadControlPdfRouter";
import { resolvers, typeDefs } from "./schema";
import { userActivationHandler } from "./users/activation";
import { createUserDataLoaders } from "./users/dataloaders";
import { getUIBaseURL } from "./utils";
import { captchaGen, captchaSound } from "./captcha/captchaGen";
import { GraphQLError } from "graphql";
import { GraphQLContext } from "./types";
import { ValidationError } from "yup";
import { ZodError } from "zod";

const {
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  SESSION_NAME,
  UI_HOST,
  MAX_REQUESTS_PER_WINDOW = "1000",
  NODE_ENV,
  TRUST_PROXY_HOPS
} = process.env;

const Sentry = initSentry();

const UI_BASE_URL = getUIBaseURL();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// GraphQL endpoint
const graphQLPath = "/";

export const server = new ApolloServer<GraphQLContext>({
  schema,
  introspection: true, // used to enable the playground in production
  validationRules: [depthLimit(10)],
  allowBatchedHttpRequests: true,
  formatError: (formattedError, error) => {
    // Catch Yup `ValidationError` and throw a `UserInputError` instead of an `InternalServerError`
    const originalError = unwrapResolverError(error);

    if (originalError instanceof ValidationError) {
      return new UserInputError(originalError.errors.join("\n"));
    }
    if (originalError instanceof ZodError) {
      return new UserInputError(
        originalError.issues.map(issue => issue.message).join("\n"),
        { issues: originalError.issues }
      );
    }
    if (
      formattedError.extensions?.code === ErrorCode.INTERNAL_SERVER_ERROR &&
      NODE_ENV === "production"
    ) {
      // Workaround for graphQL validation error displayed as internal server error
      // when graphQL variables are of of invalid type
      // See: https://github.com/apollographql/apollo-server/issues/3498
      if (
        formattedError.message &&
        formattedError.message.startsWith(`Variable "`)
      ) {
        formattedError.extensions.code = "GRAPHQL_VALIDATION_FAILED";
        return formattedError;
      }
      // Do not leak error for internal server error in production
      const sentryId = (originalError as any).sentryId;
      return new GraphQLError(
        sentryId
          ? `Erreur serveur : rapport d'erreur ${sentryId}`
          : "Erreur serveur",
        {
          extensions: {
            code: ErrorCode.INTERNAL_SERVER_ERROR
          }
        }
      );
    }

    return formattedError;
  },
  plugins: [
    graphiqlLandingPagePlugin(),
    ...(Sentry ? [sentryReporter] : []),
    graphqlQueryMergingLimiter()
  ]
});

export const app = express();

if (Sentry) {
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

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

const RATE_LIMIT_WINDOW_SECONDS = 60;

app.use(
  rateLimiterMiddleware({
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    maxRequestsPerWindow: parseInt(MAX_REQUESTS_PER_WINDOW, 10)
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
        upgradeInsecureRequests: NODE_ENV === "production" ? [] : null
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
  graphqlRateLimiterMiddleware("createPasswordResetRequest", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    maxRequestsPerWindow: 3 // 3 requests each minute (captcha)
  })
);

// logging middleware
app.use(loggingMiddleware(graphQLPath));

app.use(graphQLPath, timeoutMiddleware());

// configure session for passport local strategy
const RedisStore = redisStore(session);

export const sess: session.SessionOptions = {
  store: new RedisStore({ client: redisClient }),
  name: SESSION_NAME || "trackdechets.connect.sid",
  secret: SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    domain: SESSION_COOKIE_HOST || UI_HOST,
    maxAge: 24 * 3600 * 1000
  }
};

// The app is always served under one or more reverse proxy:
// - nginx during local development
// - Scalingo proxy for live envs
// - with Baleen, there is a second reverse proxy layer. Hence, the user's ip is 1 hop further
// For more details, see https://expressjs.com/en/guide/behind-proxies.html.
app.set("trust proxy", TRUST_PROXY_HOPS ? parseInt(TRUST_PROXY_HOPS, 10) : 1);

if (SESSION_COOKIE_SECURE === "true" && sess.cookie) {
  sess.cookie.secure = true; // serve secure cookies
}

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());
app.use(graphQLPath, graphqlRegenerateSessionMiddleware("changePassword"));

// authentification routes used by td-ui (/login /logout, /isAuthenticated)
app.use(authRouter);
app.use(oauth2Router);
app.use(oidcRouter);

// The following  middlewares use email to generate rate limit redis key and therefore
// must stay after passport initialization to ensure req.user.email is available

// Hacker might massively create apps or tokens to annoy us or exhaust our db
app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("createApplication", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 3 * 1000,
    maxRequestsPerWindow: 3 // 3 requests each 3 minutes
  })
);
app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("createAccessToken", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 3 * 1000,
    maxRequestsPerWindow: 3 // 3 requests each 3 minutes
  })
);
// Hacker might massively invite or reinvite users to spam them
app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("inviteUserToCompany", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 3 * 1000,
    maxRequestsPerWindow: 10 // 10 requests each 3 minutes
  })
);

app.use(
  graphQLPath,
  graphqlRateLimiterMiddleware("resendInvitation", {
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 3 * 1000,
    maxRequestsPerWindow: 10 // 10 requests each 3 minutes
  })
);

app.get("/ping", (_, res) => res.send("Pong!"));

app.get("/ip", (req, res) => {
  return res.send(`IP: ${req.ip} | XFF: ${req.get("X-Forwarded-For")}`);
});

app.get("/captcha", (_, res) => captchaGen(res));

app.get("/captcha-audio/:tokenId", (req, res) => {
  captchaSound(req.params.tokenId, res);
});

app.post("/userActivation", userActivationHandler);

app.get("/download", downloadRouter);

app.get("/exports", (_, res) =>
  res
    .status(410)
    .send("Route dépréciée, utilisez la query GraphQL `formsRegister`")
);

app.get(`/${ROAD_CONTROL_SLUG}/:token`, roadControlPdfHandler);

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
app.use(graphQLPath, passportBearerMiddleware);

const USERS_BLACKLIST_ENV = process.env.USERS_BLACKLIST;
let blacklist: string[] = [];
if (USERS_BLACKLIST_ENV && USERS_BLACKLIST_ENV.length > 0) {
  blacklist = USERS_BLACKLIST_ENV.split(",");
}
app.use(function checkBlacklist(req, res, next) {
  if (req.user && blacklist.includes(req.user.email)) {
    return res.send("Too Many Requests").status(429);
  }
  next();
});

// Returns 404 Not Found for every routes not handled by apollo
app.use((req, res, next) => {
  if (req.path !== graphQLPath) {
    return res.status(404).send("Not found");
  }
  next();
});

if (Sentry) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

export const serverDataloaders = {
  ...createUserDataLoaders(),
  ...createCompanyDataLoaders(),
  ...createFormDataLoaders(),
  ...createEventsDataLoaders()
};

export async function startApolloServer() {
  await server.start();

  app.use(
    graphQLPath,
    cors({
      origin: [UI_BASE_URL],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    }),
    json(),
    expressMiddleware(server, {
      context: async ctx => {
        return {
          ...ctx,
          // req.user is made available by passport
          user: ctx.req?.user ? { ...ctx.req?.user, ip: ctx.req?.ip } : null,
          dataloaders: serverDataloaders
        };
      }
    })
  );
}
