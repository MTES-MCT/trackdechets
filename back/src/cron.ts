import * as cron from "cron";
import cronValidator from "cron-validate";
import {
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendPendingRevisionRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
} from "./commands/onboarding.helpers";
import { initSentry } from "./common/sentry";
import { cleanUnusedAppendix1ProducerBsdds } from "./commands/appendix1.helpers";

const {
  CRON_ONBOARDING_SCHEDULE,
  FIRST_ONBOARDING_TEMPLATE_ID,
  PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
  PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID,
  VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID
} = process.env;

let jobs: cron.CronJob[] = [
  new cron.CronJob({
    cronTime: "30 0 * * *", // Every day at 00:30
    onTick: async () => {
      await cleanUnusedAppendix1ProducerBsdds();
    },
    timeZone: "Europe/Paris"
  })
];

if (CRON_ONBOARDING_SCHEDULE) {
  validateOnbardingCronSchedule(CRON_ONBOARDING_SCHEDULE);

  if (
    !FIRST_ONBOARDING_TEMPLATE_ID ||
    !PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID ||
    !PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID ||
    !VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID
  ) {
    throw new Error(
      `Cannot start onboarding email cron job because some email templates were not configured :
      - FIRST_ONBOARDING_TEMPLATE_ID
      - PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID
      - PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
      - VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID`
    );
  }

  jobs = [
    ...jobs,
    // second onbarding email
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendSecondOnboardingEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // new users with no company nor membership request
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendMembershipRequestDetailsEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // users with no answer to their membership requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingMembershipRequestDetailsEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // admins who did not answer to membership requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingMembershipRequestToAdminDetailsEmail();
      },
      timeZone: "Europe/Paris"
    }),
    // admins who did not answer to revision requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingRevisionRequestToAdminDetailsEmail();
      },
      timeZone: "Europe/Paris"
    })
  ];
}

const Sentry = initSentry();

if (Sentry) {
  jobs.forEach(job => {
    job.fireOnTick = async function () {
      for (let i = this._callbacks.length - 1; i >= 0; i--) {
        try {
          await this._callbacks[i].call(this.context, this.onComplete);
        } catch (err) {
          Sentry.captureException(err);
        }
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
