import * as cron from "cron";
import {
  sendFirstOnboardingEmail,
  sendSecondOnboardingEmail
} from "./commands/onboarding.helpers";

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
  const everyMorning = "0 8 * * *";
  jobs = [
    ...jobs,
    // first onboarding email
    new cron.CronJob({
      cronTime: everyMorning,
      onTick: async function () {
        await sendFirstOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // second onbarding email
    new cron.CronJob({
      cronTime: everyMorning,
      onTick: async function () {
        await sendSecondOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    })
  ];
}

jobs.forEach(job => job.start());
