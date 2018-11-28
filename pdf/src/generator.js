const puppeteer = require("puppeteer");

const html = require("fs").readFileSync("./models/bsd.html", "utf8");

const t = '<html>${params.a}</html>'

function assemble(literal, params) {
  return new Function(params, "return `"+literal+"`;"); // TODO: Proper escaping
}
var template = assemble("<html>${params.a}</html>", "params");
template({a: 1});

async function write(params) {
  console.log(params)

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  
  const buffer = await page.pdf({ format: "A4" });

  await browser.close();
  return buffer;
}

module.exports = write;
