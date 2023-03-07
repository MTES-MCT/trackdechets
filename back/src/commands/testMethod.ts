import {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
} from "./onboarding.helpers";

// Declare the jobs that can be called by the script
const METHODS = {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
};

// Usage (in the back/ folder): npm run testMethod -- methodName parameter
// ex: npm run testMethod -- sendPendingMembershipRequestToAdminDetailsEmail 10
const job = process.argv[2];
const param = process.argv[3];

console.log(`Trying to execute method '${job}' with param '${param}'`);

if (!METHODS[job]) {
  throw `Method '${job}' does not exist`;
}

// Execute job
METHODS[job](param);
