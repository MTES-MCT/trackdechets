import { userMails } from "../users/mails";
import { sendMail } from "../common/mails.helper";
import { prisma } from "../generated/prisma-client";

/**
 * Compute a past date relative to now

 * @param baseDate Date
 * @param daysAgo Integer
 * @return a date formatted as "YYYY-MM-DD"
 */
export const xDaysAgo = (baseDate: Date, daysAgo: number): string => {
  const clonedDate = new Date(baseDate.getTime()); // avoid mutating baseDate
  return new Date(clonedDate.setDate(clonedDate.getDate() - daysAgo))
    .toISOString()
    .split("T")[0];
};

async function onboardingEmail(recipients, emailFunction) {
  return Promise.all(
    recipients.map(recipient => {
      let payload = emailFunction(recipient.email, recipient.name);

      return sendMail(payload);
    })
  );
}

async function firstOnboarding(recipients) {
  return Promise.all(
    recipients.map(recipient => {
      let payload = userMails.onboardingFirstStep(
        recipient.email,
        recipient.name
      );

      return sendMail(payload);
    })
  );
}
async function secondOnboarding(recipients) {
  return Promise.all(
    recipients.map(recipient => {
      let payload = userMails.onboardingSecondStep(
        recipient.email,
        recipient.name
      );

      return sendMail(payload);
    })
  );
}

export const sendOnboardingFirstStepMails = async () => {
  const now = new Date();

  const inscriptionDateGt = xDaysAgo(now, 1); //1 day ago
  const inscriptionDateLt = xDaysAgo(now, 0); //0 day ago
  // retrieve users whose account was created yesterday
  let recipients = await prisma.users({
    where: {
      AND: [
        { createdAt_gt: inscriptionDateGt },
        { createdAt_lt: inscriptionDateLt }
      ],
      isActive: true
    }
  });

  await onboardingEmail(recipients, userMails.onboardingFirstStep);
};

export const sendOnboardingSecondStepMails = async () => {
  const now = new Date();
  const inscriptionDateGt = xDaysAgo(now, 3); // 3 days ago
  const inscriptionDateLt = xDaysAgo(now, 2); // 2 days ago
  // retrieve users whose account was created 3 days ago
  let recipients = await prisma.users({
    where: {
      AND: [
        { createdAt_gt: inscriptionDateGt },
        { createdAt_lt: inscriptionDateLt }
      ],
      isActive: true
    }
  });

  await onboardingEmail(recipients, userMails.onboardingSecondStep);
};
