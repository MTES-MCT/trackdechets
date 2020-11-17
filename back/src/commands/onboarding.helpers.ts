import prisma from "src/prisma";
import { sendMail } from "../mailer/mailing";
import { userMails } from "../users/mails";

/**
 * Compute a past date relative to now
 *
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

/**
 * Send onboarding emails to relevant users
 *
 * @param daysAgo Integer when did our users subscribe
 * @param emailFunction the function building relevant email content
 */
export const sendOnboardingEmails = async (daysAgo: number, emailFunction) => {
  const now = new Date();

  const inscriptionDateGt = xDaysAgo(now, daysAgo);
  const inscriptionDateLt = xDaysAgo(now, daysAgo - 1);
  // retrieve users whose account was created yesterday
  const recipients = await prisma.user.findMany({
    where: {
      AND: [
        { createdAt_gt: inscriptionDateGt },
        { createdAt_lt: inscriptionDateLt }
      ],
      isActive: true
    }
  });

  await Promise.all(
    recipients.map(recipient => {
      const payload = emailFunction(recipient.email, recipient.name);

      return sendMail(payload);
    })
  );
};

/**
 * Send first step onboarding email to active users who suscribed yesterday
 */
export const sendOnboardingFirstStepMails = () =>
  sendOnboardingEmails(1, userMails.onboardingFirstStep);

/**
 * Send second step onboarding email to active users who suscribed 3 days ago
 */
export const sendOnboardingSecondStepMails = () =>
  sendOnboardingEmails(3, userMails.onboardingSecondStep);
