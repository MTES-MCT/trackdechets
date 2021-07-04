import { Bsda } from "@prisma/client";
import { format } from "date-fns";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";
import { join } from "path";
import QRCode from "qrcode";
import { pipe, gotenberg, convert, html, please } from 'gotenberg-js-client'


const toPDF = pipe(
  gotenberg('https://trackdechetsv2131avx-gotenberg.functions.fnc.fr-par.scw.cloud'),
  convert,
  html,
  please
)

export async function buildPdf(bsda: Bsda) {
  const signatureStamp = await readFile(
    join(__dirname, "/templates/stamp.svg"),
    {
      encoding: "utf8"
    }
  );
  const template = await readFile(join(__dirname, "/templates/bsda.html"), {
    encoding: "utf8"
  });

  Handlebars.registerHelper("dateFmt", safeDateFmt);

  const qrcode = !bsda.isDraft
    ? await QRCode.toString(bsda.id, { type: "svg" })
    : "";
  const source = template.toString();
  const compiled = Handlebars.compile(source);
  const html = compiled({ bsda, qrcode, signatureStamp });

  // TODO do smthing with generated HTML. Waiting for gotenberg to be setup
  console.log(html);
  const pdf = await toPDF({
    'index.html': html,
    'bsda.css': 'todo',
    "OpenSans-Regular.ttf": ""
  })

  return null;
}

const safeDateFmt = (dt: Date) => {
  if (!dt) {
    return "";
  }
  return format(dt, "dd/MM/yyyy");
};
