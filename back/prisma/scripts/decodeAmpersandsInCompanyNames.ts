import decodeAmpersandsInCompanyNames from "../../src/scripts/prisma/decodeAmpersandsInCompanyNames";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Replace &amp; with & in company names",
  "Replace &amp; with & in company names",
  false
)
export class DecodeAmpersandsInCompanyNames implements Updater {
  async run() {
    console.info("Starting script to decode ampersands in company names...");
    await decodeAmpersandsInCompanyNames();
  }
}
