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

const { CRON_ONBOARDING_SCHEDULE, TZ } = process.env;

let jobs: cron.CronJob[] = [
  new cron.CronJob({
    cronTime: "30 0 * * *", // Every day at 00:30
    onTick: async () => {
      await cleanUnusedAppendix1ProducerBsdds();
    },
    timeZone: TZ
  })
];

if (CRON_ONBOARDING_SCHEDULE) {
  validateOnbardingCronSchedule(CRON_ONBOARDING_SCHEDULE);

  jobs = [
    ...jobs,
    // second onbarding email
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendSecondOnboardingEmail();
      },
      timeZone: TZ
    }),
    // new users with no company nor membership request
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendMembershipRequestDetailsEmail();
      },
      timeZone: TZ
    }),
    // users with no answer to their membership requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingMembershipRequestDetailsEmail();
      },
      timeZone: TZ
    }),
    // admins who did not answer to membership requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingMembershipRequestToAdminDetailsEmail();
      },
      timeZone: TZ
    }),
    // admins who did not answer to revision requests
    new cron.CronJob({
      cronTime: CRON_ONBOARDING_SCHEDULE,
      onTick: async () => {
        await sendPendingRevisionRequestToAdminDetailsEmail();
      },
      timeZone: TZ
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
