import express from "express";
import helmet from "helmet";
import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";

const app = express();

const SENTRY_DSN = process.env.VITE_SENTRY_DSN;

const DEFAULT_SRC = [
  "'self'",
  "*.trackdechets.beta.gouv.fr",
  "*.trackdechets.fr"
];

const CONNECT_SRC = [
  ...DEFAULT_SRC,
  "https://api-adresse.data.gouv.fr",
  "https://sentry.incubateur.net",
  "https://openmaptiles.geo.data.gouv.fr",
  "https://openmaptiles.github.io",
  "https://s3.fr-par.scw.cloud"
];

const WORKER_SRC = ["blob:"]; // needed for MapBox

app.use(
  helmet({
    frameguard: {
      action: "deny"
    },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: DEFAULT_SRC,
        connectSrc: CONNECT_SRC,
        workerSrc: WORKER_SRC,
        baseUri: "'self'",
        formAction: ["http:"], // allow external redirects for oauth workflow
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'self'", "data:"],
        frameAncestors: "'none'",
        frameSrc: ["'self'", "data:"],
        imgSrc: ["'self'", "data:", "http:"], // allow oauth applications logos
        scriptSrc: ["'self'", "https:", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        mediaSrc: ["'self'", "data:"]
      }
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })
);

const directory = path.join(__dirname, "../../../../../front");
app.use(express.static(directory));

const pathToIndex = path.join(directory, "index.html");

const raw = fs.readFileSync(pathToIndex, "utf8");
const indexContent =
  process.env.NO_INDEX === "true"
    ? raw.replace(
        '<meta name="robots" content="all" />',
        '<meta name="robots" content="noindex nofollow" />'
      )
    : raw;

app.use(express.text());

// Sentry tunnel to deal with ad blockers
// https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
// https://github.com/getsentry/examples/blob/master/tunneling/nextjs/pages/api/tunnel.js
app.post("/sentry", async function (req, res) {
  if (!SENTRY_DSN) {
    return res.status(500).json({ status: "sentry n'est pas configuré" });
  }
  try {
    const envelope = req.body;
    // DSNs are of the form `https://<key>@o<orgId>.ingest.sentry.io/<projectId>`
    const { host, pathname } = new URL(SENTRY_DSN);
    // Remove leading slash
    const projectId = pathname.substring(1);
    const sentryIngestURL = `https://${host}/api/${projectId}/envelope/`;
    const sentryResponse = await fetch(sentryIngestURL, {
      method: "POST",
      body: envelope
    });
    // Relay response from Sentry servers to front end
    sentryResponse.headers.forEach(h => res.setHeader(h[0], h[1]));
    res.status(sentryResponse.status).send(sentryResponse.body);
  } catch (_) {
    return res.status(400).json({ status: "invalid request" });
  }
});

app.get("/*", function (req, res) {
  res.send(indexContent);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Trackdechets front listening on", port);
});
