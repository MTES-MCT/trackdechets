import * as cron from "cron";
import {
  sendOnboardingFirstStepMails,
  sendOnboardingSecondStepMails
} from "./commands/onboarding.helpers";

const everyMorning = "0 8 * * *";

const sendOnbardingEmailsEveryMorning = [
  // first onboarding email
  new cron.CronJob({
    cronTime: everyMorning,
    onTick: async function () {
      await sendOnboardingFirstStepMails();
    },
    timeZone: "Europe/Paris"
  }),
  // second onbarding email
  new cron.CronJob({
    cronTime: everyMorning,
    onTick: async function () {
      await sendOnboardingSecondStepMails();
    },
    timeZone: "Europe/Paris"
  })
];

sendOnbardingEmailsEveryMorning.forEach(job => job.start());
