import consoleBackend from "./backends/consoleBackend";
import sendInBlueBackend from "./backends/sendInBlueBackend";

const backends = {
  console: consoleBackend,
  sendinblue: sendInBlueBackend
};

export const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}
