import * as cron from "cron";
import cronValidator from "cron-validate";
import {
  sendFirstOnboardingEmail,
  sendSecondOnboardingEmail
} from "./commands/onboarding.helpers";
import { initSentry } from "./common/sentry";

const {
  CRON_ONBOARDING_SCHEDULE,
  FIRST_ONBOARDING_TEMPLATE_ID,
  PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
  PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
} = process.env;

let jobs = [];

if (CRON_ONBOARDING_SCHEDULE) {
  validateOnbardingCronSchedule(CRON_ONBOARDING_SCHEDULE);

  if (
    !FIRST_ONBOARDING_TEMPLATE_ID ||
    !PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID ||
    !PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
  ) {
    throw new Error(
      `Cannot start onboarding email cron job because some email templates were not configured :
      - FIRST_ONBOARDING_TEMPLATE_ID
      - PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID
      - PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID`
    );
  }

  jobs = [
    ...jobs,
    // first onboarding email
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendFirstOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // second onbarding email
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
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

export function validateOnbardingCronSchedule(cronExp: string) {
  // checks it is a valid cron quartz expression
  const isValid = cronValidator(cronExp).isValid();

  if (!isValid) {
    throw new Error(`Invalid CRON expression : ${cronExp}`);
  }

  // checks it is set to run once every day
  const everyDay = /^\d{1,2} \d{1,2} \* \* \*$/;
  if (!everyDay.test(cronExp)) {
    throw new Error(
      "CRON expression should be set to run once every day : {m} {h} * * *"
    );
  }

  return true;
}
