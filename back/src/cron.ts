import * as cron from "cron";
import * as Sentry from "@sentry/node";
import {
  sendFirstOnboardingEmail,
  sendSecondOnboardingEmail
} from "./commands/onboarding.helpers";
import { CaptureConsole } from "@sentry/integrations";

const {
  FIRST_ONBOARDING_TEMPLATE_ID,
  PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
  PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT
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

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    integrations: [new CaptureConsole({ levels: ["error"] })]
  });

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
