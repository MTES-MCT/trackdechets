import "./tracer";

import redisStore from "connect-redis";
import cors from "cors";
import express, { json, urlencoded } from "express";
import session from "express-session";
import helmet from "helmet";
import passport from "passport";
import errorHandler from "./common/middlewares/errorHandler";
import { rateLimiterMiddleware } from "./common/middlewares/rateLimiter";
import { redisClient } from "./common/redis";
import { initSentry } from "./common/sentry";
import { authRouter } from "./routers/auth-router";
import { downloadRouter } from "./routers/downloadRouter";
import { oauth2Router } from "./routers/oauth2-router";
import { oidcRouter } from "./routers/oidc-router";
import { getUIBaseURL } from "./utils";
import { RATE_LIMIT_WINDOW_SECONDS } from "./server";
import { envVariables } from "./env";

const {
  SESSION_SECRET,
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_SECURE,
  SESSION_NAME,
  UI_HOST,
  MAX_REQUESTS_PER_WINDOW = "1000",
  TRUST_PROXY_HOPS
} = process.env;

const Sentry = initSentry();

const UI_BASE_URL = getUIBaseURL();

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

app.use(
  rateLimiterMiddleware({
    windowMs: RATE_LIMIT_WINDOW_SECONDS * 1000,
    maxRequestsPerWindow: parseInt(MAX_REQUESTS_PER_WINDOW, 10)
  })
);

app.use(
  helmet({
    hsts: false // Auto injected by Scalingo
  })
);

/**
 * parse application/x-www-form-urlencoded
 * used when submitting login form
 */
app.use(urlencoded({ extended: false }));

app.use(json());

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

// authentification routes used by td-ui (/login /logout, /isAuthenticated)
app.use(authRouter);
app.use(oauth2Router);
app.use(oidcRouter);

// The following  middlewares use email to generate rate limit redis key and therefore
// must stay after passport initialization to ensure req.user.email is available

app.get("/download", downloadRouter);

if (Sentry) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

envVariables.parse(process.env);

async function start() {
  app.listen(process.env.API_PORT, () =>
    console.info(`Server /download is running on port ${process.env.API_PORT}`)
  );
}

start();
