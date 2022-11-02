import { closeCompanyQueues } from "./company";
import { closeIndexAndUpdatesQueue } from "./elastic";
import { closeMailQueue } from "./mail";

export function closeQueues() {
  return Promise.all([
    closeIndexAndUpdatesQueue(),
    closeMailQueue(),
    closeCompanyQueues()
  ]);
}
