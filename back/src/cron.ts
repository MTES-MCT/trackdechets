import * as cron from "cron";
import {
  sendFirstOnboardingEmail,
  sendSecondOnboardingEmail
} from "./commands/onboarding.helpers";
import { initSentry } from "./common/sentry";

const {
  FIRST_ONBOARDING_TEMPLATE_ID,
  PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
  PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
} = process.env;

let jobs = [];

const shouldOnboard =
  !!FIRST_ONBOARDING_TEMPLATE_ID &&
  !!PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID &&
  !!PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID;

if (shouldOnboard) {
  // every morning at 8h08. Avoid sending it at 8h00 to prevent traffic congestions.
  const everyMorning = "8 8 * * *";
  jobs = [
    ...jobs,
    // first onboarding email
    new cron.CronJob({
      cronTime: everyMorning,
      onTick: async () => {
        await sendFirstOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // second onbarding email
    new cron.CronJob({
      cronTime: everyMorning,
      onTick: async () => {
        await sendSecondOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    })
  ];
}

const Sentry = initSentry();

if (Sentry) {
  jobs.forEach(job => {
    const onTick = job.onTick;
    job.onTick = async () => {
      try {
        await onTick();
      } catch (err) {
        Sentry.captureException(err);
      }
    };
  });
}

jobs.forEach(job => job.start());
