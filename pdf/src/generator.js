const puppeteer = require("puppeteer");
const doT = require("dot");

const html = require("fs").readFileSync("./models/bsd.html", "utf8");
const tempFn = doT.template(html);

const toDate = string => {
  const date = new Date(string);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

async function write(params) {
  const pageContent = tempFn({ toDate, ...params });

  const browser = await puppeteer
    .launch({
      args: ["--no-sandbox"]
    })
    .catch(err => console.error("Cannot launch puppeteer", err));
  const page = await browser
    .newPage()
    .catch(err => console.error("Error while starting new page", err));
  await page.setContent(pageContent);

  const buffer = await page
    .pdf({ format: "A4" })
    .catch(err => console.error("Error while generating PDF", err));

  await browser
    .close()
    .catch(err => console.error("Error while closing buffer", err));
  return buffer;
}

module.exports = write;
