import "@total-typescript/ts-reset";
import type { EnvVariables } from "@td/env";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<EnvVariables> {}
  }
}
