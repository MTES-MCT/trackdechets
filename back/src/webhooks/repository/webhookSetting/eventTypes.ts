// for event logging
type WebhookPrefix = "WebhookSetting";

export type webhooksEventTypes = {
  created: `${WebhookPrefix}Created`;
  updated: `${WebhookPrefix}Updated`;
  deleted: `${WebhookPrefix}Deleted`;
};

export const webhookSettingEventTypes: webhooksEventTypes = {
  created: "WebhookSettingCreated",
  updated: "WebhookSettingUpdated",
  deleted: "WebhookSettingDeleted"
};
