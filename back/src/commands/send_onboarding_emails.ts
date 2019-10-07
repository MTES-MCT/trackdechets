import {
  sendOnboardingFirstStepMails,
  sendOnboardingSecondStepMails
} from "./onboarding.helpers";

sendOnboardingFirstStepMails()
  .then(() => {
    console.log("Sending onboarding first step emails");
  })
  .catch(() => {
    console.error("Error while trying to send onboarding first step emails");
  });
sendOnboardingSecondStepMails()
  .then(() => {
    console.log("Sending onboarding second step emails");
  })
  .catch(() => {
    console.error("Error while trying to send onboarding second step emails");
  });
