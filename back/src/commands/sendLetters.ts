import { sendVerificationCodeLetters } from "../companies/verif";

sendVerificationCodeLetters()
  .then(() => {
    console.log("Successfully sent verification code letters");
  })
  .catch(() => {
    console.error("Error while trying to send verification code letters");
  });
