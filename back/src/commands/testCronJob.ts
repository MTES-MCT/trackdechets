import {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
} from "./onboarding.helpers";

// Declare the jobs that can be called by the script
const CRON_JOBS = {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
};

// Usage (in the back/ folder): npm run testCronJob -- methodName parameter
// ex: npm run testCronJob -- sendPendingMembershipRequestToAdminDetailsEmail 10
const job = process.argv[2];
const param = process.argv[3];

console.log(`Trying to execute script '${job}' with param '${param}'`);

if (!CRON_JOBS[job]) {
  throw `Job '${job}' does not exist`;
}

// Execute job
CRON_JOBS[job](param);
