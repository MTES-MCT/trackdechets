import { Page } from "@playwright/test";

export const logScreenshot = async (page: Page) => {
  const buffer = await page.screenshot();
  console.log(buffer.toString("base64"));
};

export const debugApiCalls = async (page: Page) => {
  // Requests
  page.on("request", async request => {
    if (request.url().includes(process.env.API_HOST)) {
      console.log(">>", request.method(), request.url(), await request.allHeaders(), request.postData());
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
