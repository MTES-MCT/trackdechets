const polka = require("polka");
const { json } = require("body-parser");
const write = require("./generator");

const PORT = 3201;

const app = polka().use(json());

app.get("ping", (_, res) => res.end("pong"));

app.post("/pdf", async (req, res) => {
  try {
    const bufferPdf = await write(req.body);

    const date = new Date();
    const fileName = `BSD_${Math.round(
      Math.random() * 1000
    )}_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-disposition": `attachment;filename=${fileName}.pdf`,
      "Content-Length": bufferPdf.length
    });

    res.end(bufferPdf);
  } catch (err) {
    res.statusCode = 501;
    res.end("Une erreur est survenue lors de la génération du PDF.");
  }
});

app.listen(PORT, err => {
  if (err) throw err;
  console.log(`> Running on localhost:${PORT}`);
});
