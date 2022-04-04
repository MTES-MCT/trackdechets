import sendVerificationCodeLetters from "../../src/scripts/prisma/sendVerificationCodeLetters";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Send verification code letters",
  "Send verification code letters to all companies that have not yet been verified manually",
  false
)
export class SendVerificationCode implements Updater {
  run() {
    console.info(
      "Starting script to send verification code letters, this may take some time...."
    );
    try {
      return sendVerificationCodeLetters();
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
