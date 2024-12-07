import createWebhookSetting from "./mutations/create";
import updateWebhookSetting from "./mutations/update";
import deleteWebhookSetting from "./mutations/delete";

import type { MutationResolvers } from "@td/codegen-back";

const Mutation: MutationResolvers = {
  createWebhookSetting,
  updateWebhookSetting,
  deleteWebhookSetting
};

export default Mutation;
