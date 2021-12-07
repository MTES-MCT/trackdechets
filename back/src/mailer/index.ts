import consoleBackend from "./backends/consoleBackend";
import mailjetBackend from "./backends/mailjetBackend";
import sendInBlueBackend from "./backends/sendInBlueBackend";

const backends = {
  console: consoleBackend,
  mailjet: mailjetBackend,
  sendinblue: sendInBlueBackend
};

export const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}
