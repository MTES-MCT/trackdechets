import { Bsvhu } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  pipe,
  gotenberg,
  convert,
  html,
  please,
  to,
  adjust
} from "gotenberg-js-client";

const { GOTENBERG_TOKEN, GOTENBERG_URL } = process.env;

const toPDF = pipe(
  gotenberg(GOTENBERG_URL),
  convert,
  html,
  to({
    marginTop: 0.2,
    marginBottom: 0.2,
    marginLeft: 0.2,
    marginRight: 0.2
  }),
  adjust({ headers: { "X-Auth-Token": GOTENBERG_TOKEN ?? "" } }),
  please
);

export async function buildPdf(form: Bsvhu) {
  const htmlModel = await getTemplateStringFile("model.html");
  const htmlDocument = render(htmlModel, { form });

  const files = {
    "index.html": htmlDocument,
    "model.css": await getTemplateStringFile("model.css")
  };

  return toPDF(files);
}

async function getTemplateStringFile(filename: string) {
  const buffer = await readFile(join(__dirname, "template", filename));
  return buffer.toString();
}

/**
 * Build a "reusable" template litteral as a very basic template engine
 * @param model HTML model with classic template litterals var interpolation (`${myVar}`)
 * @param data Data used to replace vars placeholders
 */
function render(model: string, data = {}) {
  const handler = new Function(
    "data",
    `const tagged = (${Object.keys(data).join(", ")}) => \`${model}\`
    return tagged(...Object.values(data))`
  );

  return handler(data);
}
