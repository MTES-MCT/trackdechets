import { hashTokens } from "../../src/scripts/prisma/hash-tokens";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "hash existing tokens",
  "retrieve existing access token and hash their token value with sha256 alg",
  true
)
export class HashTokens implements Updater {
  run() {
    console.info("Starting script to hash tokens...");
    try {
      return hashTokens();
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
