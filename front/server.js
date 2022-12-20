const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const app = express();

const DEFAULT_SRC = [
  "'self'",
  "*.trackdechets.beta.gouv.fr",
  "*.trackdechets.fr",
];

const CONNECT_SRC = [
  ...DEFAULT_SRC,
  "https://api-adresse.data.gouv.fr",
  "https://sentry.incubateur.net",
];

app.use(
  helmet({
    frameguard: {
      action: "deny",
    },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: DEFAULT_SRC,
        connectSrc: CONNECT_SRC,
        baseUri: "'self'",
        formAction: ["http:"], // allow external redirects for oauth workflow
        fontSrc: ["'self'", "https:", "data:"],
        frameAncestors: "'none'",
        frameSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http:"], // allow oauth applications logos
        scriptSrc: ["'self'", "https:", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      },
    },
  })
);

const directory = "/" + (process.env.STATIC_DIR || "build");
app.use(express.static(__dirname + directory));

const pathToIndex = path.join(__dirname, directory, "index.html");

const raw = fs.readFileSync(pathToIndex, "utf8");
const indexContent =
  process.env.NO_INDEX === true
    ? raw.replace(
        '<meta name="robots" content="all" />',
        '<meta name="robots" content="noindex nofollow" />'
      )
    : raw;

app.use(bodyParser.text());

// Sentry tunnel to deal with ad blockers
// https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
// https://github.com/getsentry/examples/blob/master/tunneling/nextjs/pages/api/tunnel.js
app.post("/sentry", async function (req, res) {
  try {
    const envelope = req.body;
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);
    // DSNs are of the form `https://<key>@o<orgId>.ingest.sentry.io/<projectId>`
    const { host, pathname } = new URL(header.dsn);
    // Remove leading slash
    const projectId = pathname.substring(1);
    const sentryIngestURL = `https://${host}/api/${projectId}/envelope/`;
    const sentryResponse = await fetch(sentryIngestURL, {
      method: "POST",
      body: envelope,
    });

    // Relay response from Sentry servers to front end
    sentryResponse.headers.forEach(h => res.setHeader(h[0], h[1]));
    res.status(sentryResponse.status).send(sentryResponse.body);
  } catch (err) {
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
