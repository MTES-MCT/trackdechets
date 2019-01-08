const polka = require("polka");
const { json } = require("body-parser");
const write = require("./generator");

const app = polka().use(json());

app.get("ping", res => res.end("pong"));

app.post("/pdf", async (req, res) => {
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
});

app.listen(3000, err => {
  if (err) throw err;
  console.log(`> Running on localhost:3000`);
});
