import { Page } from "@playwright/test";

/**
 * Will take a screenshot of the page and log it to the console in base64,
 * which is handy when trying to debug the CI.
 * Use a website like https://base64.guru/converter/decode/image to decode.
 */
export const logScreenshot = async (page: Page) => {
  const buffer = await page.screenshot();
  console.log(buffer.toString("base64"));
};

/**
 * Will log API-related requests & responses
 */
export const debugApiCalls = async (page: Page) => {
  // Requests
  page.on("request", async request => {
    if (request.url().includes(process.env.API_HOST)) {
      console.log(
        ">>",
        request.method(),
        request.url(),
        await request.allHeaders(),
        request.postData()
      );
    }
  });

  // Responses
  page.on("response", async response => {
    if (response.url().includes(process.env.API_HOST)) {
      try {
        console.log(
          "<<",
          response.status(),
          response.url(),
          await response.json()
        );
      } catch (e) {
        console.log("<<", response.status(), response.url());
      }
    }
  });
};
