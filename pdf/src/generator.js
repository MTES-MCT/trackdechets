const puppeteer = require("puppeteer");
const doT = require("dot");

const html = require("fs").readFileSync("./models/bsd.html", "utf8");
const tempFn = doT.template(html);

async function write(params) {
  const pageContent = tempFn(params);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(pageContent);

  const buffer = await page.pdf({ format: "A4" });

  await browser.close();
  return buffer;
}

module.exports = write;
