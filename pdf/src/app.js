const express = require("express");
const { json } = require("body-parser");
const Sentry = require("@sentry/node");

const buildPdf = require("./generator");

const sentryDsn = process.env.SENTRY_DSN;

if (!!sentryDsn) {
  Sentry.init({
    dsn: sentryDsn
  });

  Sentry.configureScope(function(scope) {
    scope.setTag("service", "pdf");
  });
}

const app = express().use(json());

app.get("/ping", (_, res) => res.end("pong"));

app.post("/pdf", async (req, res) => {
  const { readableId } = req.body;
  const date = new Date();
  const fileName = `BSD_${readableId}_${date.getDate()}-${date.getMonth() +
    1}-${date.getFullYear()}`;

  try {
    const buffer = await buildPdf(req.body);
    res.status(200);
    res.type("pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment;filename=${fileName}.pdf`);

    res.send(buffer);
  } catch (err) {
    console.log(err);
    if (!!sentryDsn) {
      Sentry.captureException(err);
    }
    res.statusCode = 501;
    res.send("Une erreur est survenue lors de la génération du PDF.");
  }
});

module.exports = app;
