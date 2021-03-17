import { VhuForm } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { connect } from "puppeteer-core";

export async function buildPdf(form: VhuForm) {
  const browser = await connect({
    browserWSEndpoint: "wss://chrome.browserless.io/"
  });

  try {
    const page = await browser.newPage();

    const htmlModel = await getTemplateStringFile("model.html");
    const htmlDocument = render(htmlModel, { form });
    await page.setContent(htmlDocument);

    const paperCss = await getTemplateStringFile("paper.min.css");
    await page.addStyleTag({ content: paperCss });
    const htmlModelStyle = await getTemplateStringFile("model.css");
    await page.addStyleTag({ content: htmlModelStyle });

    const pdfBuffer = await page.pdf({ format: "a4" });
    await browser.close();

    return pdfBuffer;
  } catch (err) {
    await browser.close();
    throw new Error("Erreur lors du téléchargement du PDF");
  }
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
