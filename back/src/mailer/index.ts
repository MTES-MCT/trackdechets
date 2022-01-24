/**
 * Dynamically import the configured mail backend
 * Avoid the need to export the environment vars for all backends
 */
const backends = {
  ...(process.env.EMAIL_BACKEND === "console" && {
    console: require("./backends/consoleBackend")
  }),
  ...(process.env.EMAIL_BACKEND === "mailjet" && {
    mailjet: require("./backends/mailjetBackend")
  }),
  ...(process.env.EMAIL_BACKEND === "sendinblue" && {
    sendinblue: require("./backends/sendInBlueBackend")
  })
};

export const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}
