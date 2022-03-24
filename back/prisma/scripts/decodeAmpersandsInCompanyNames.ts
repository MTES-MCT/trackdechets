import decodeAmpersandsInCompanyNames from "../../src/scripts/prisma/decodeAmpersandsInCompanyNames";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Replace &amp; with & in company names",
  "Replace &amp; with & in company names",
  true
)
export class DecodeAmpersandsInCompanyNames implements Updater {
  run() {
    console.info("Starting script to delete orphan companies...");
    return decodeAmpersandsInCompanyNames();
  }
}
