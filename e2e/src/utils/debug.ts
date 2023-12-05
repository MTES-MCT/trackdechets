import { Page } from "@playwright/test";

export const logScreenshot = async(page: Page) => {
    const buffer = await page.screenshot();
    console.log(buffer.toString("base64"));
};