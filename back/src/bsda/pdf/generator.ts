import { Bsda } from "@prisma/client";
import { format } from "date-fns";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";
import { join } from "path";
import QRCode from "qrcode";

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
  try {
    const source = template.toString();
    const compiled = Handlebars.compile(source);
    const html = compiled({ bsda, qrcode, signatureStamp });

    // TODO do smthing with generated HTML. Waiting for gotenberg to be setup
    console.log(html);

    return null;
  } catch (err) {
    throw new Error("Erreur lors du téléchargement du PDF");
  }
}

const safeDateFmt = (dt: Date) => {
  if (!dt) {
    return "";
  }
  return format(dt, "dd/MM/yyyy");
};
