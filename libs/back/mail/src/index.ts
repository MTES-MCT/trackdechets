import consoleBackend from "./backends/consoleBackend";
import sendInBlueBackend from "./backends/sendInBlueBackend";
import { schema } from "@td/env";

schema
  .pick({
    EMAIL_BACKEND: true,
    UI_URL_SCHEME: true,
    UI_HOST: true,
    API_URL_SCHEME: true,
    API_HOST: true
  })
  .parse(process.env);

if (!process.env.EMAIL_BACKEND) {
  throw new Error("Missing email backend configuration: EMAIL_BACKEND");
}

const backends = {
  console: consoleBackend,
  sendinblue: sendInBlueBackend
};

export const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}

export * from "./types";
export * from "./templates";
export * from "./templates/renderers";
export * from "./templates/provider/templateIds";
