const polka = require("polka");
const { json } = require("body-parser");
const Sentry = require("@sentry/node");

const write = require("./generator");

const sentryDsn = process.env.SENTRY_DSN;

if (!!sentryDsn) {
  Sentry.init({
    dsn: sentryDsn
  });

  Sentry.configureScope(function(scope) {
    scope.setTag("service", "pdf");
  });
}

const app = polka().use(json());

app.get("ping", (_, res) => res.end("pong"));

app.post("/pdf", async (req, res) => {
  const { readableId } = req.body;
  const date = new Date();
  const fileName = `BSD_${readableId}_${date.getDate()}-${date.getMonth() +
    1}-${date.getFullYear()}`;

  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-disposition": `attachment;filename=${fileName}.pdf`
  });
  try {
    write(req.body, res);
  } catch (err) {
    if (!!sentryDsn) {
      Sentry.captureException(err);
    }
    res.statusCode = 501;
    res.end("Une erreur est survenue lors de la génération du PDF.");
  }
});

module.exports = app;
