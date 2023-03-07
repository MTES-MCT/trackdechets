import {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
} from "./onboarding.helpers";

// Declare the methods that can be called by the script
const METHODS = {
  sendFirstOnboardingEmail,
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail
};

// Usage (in the back/ folder): npm run testMethod -- methodName parameter
// ex: npm run testMethod -- sendPendingMembershipRequestToAdminDetailsEmail 10
const method = process.argv[2];
const param = process.argv[3];

console.log(`Trying to execute method '${method}' with param '${param}'`);

if (!METHODS[method]) {
  throw `Method '${method}' does not exist`;
}

// Execute method
METHODS[method](param);
