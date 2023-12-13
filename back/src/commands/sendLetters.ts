import { sendVerificationCodeLetters } from "../companies/verif";
import { logger } from "@td/logger";

sendVerificationCodeLetters()
  .then(() => {
    logger.info("Successfully sent verification code letters");
  })
  .catch(() => {
    logger.error("Error while trying to send verification code letters");
  });
