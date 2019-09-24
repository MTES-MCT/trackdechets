const puppeteer = require("puppeteer");
const doT = require("dot");

const html = require("fs").readFileSync("./models/bsd.html", "utf8");
const tempFn = doT.template(html);

const toDate = string => {
  if (!string) {
    return "";
  }
  const date = new Date(string);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

let browserInstance = null;
async function getBrowser() {
  try {
    browserInstance =
      browserInstance ||
      (await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          // This will write shared memory files into /tmp instead of /dev/shm,
          // because Docker’s default for /dev/shm is 64MB
          "--disable-dev-shm-usage"
        ]
      }));
  } catch (err) {
    return Promise.reject(err);
  }

  return browserInstance;
}

async function write(params) {
  const browser = await getBrowser().catch(err =>
    logAndRethrow("Cannot launch puppeteer", err)
  );

  const pageContent = tempFn({ toDate, ...params });

  const page = await browser
    .newPage()
    .catch(err => logAndRethrow("Error while starting new page", err));
  await page.setContent(pageContent);

  const buffer = await page
    .pdf({ format: "A4" })
    .catch(err => logAndRethrow("Error while generating PDF", err));

  await page
    .close()
    .catch(err => logAndRethrow("Error while closing buffer", err));
  return buffer;
}

function logAndRethrow(message, err) {
  console.error(message, err);
  throw err;
}

module.exports = write;
