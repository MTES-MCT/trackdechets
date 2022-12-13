import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import Badge from "./Badge";
import { BadgeStatusCode } from "./badgeTypes";

export default {
  title: "COMPONENTS/Badge",
  component: Badge,
  argTypes: {
    status: {
      control: "select",
      options: Object.values(BadgeStatusCode),
    },
  },
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = args => <Badge {...args} />;

export const Draft = Template.bind({});
export const Received = Template.bind({});
export const Processed = Template.bind({});
export const Sealed = Template.bind({});
export const Refused = Template.bind({});

Draft.args = {
  status: BadgeStatusCode.DRAFT,
};

Received.args = {
  status: BadgeStatusCode.RECEIVED,
};

Processed.args = {
  status: BadgeStatusCode.PROCESSED,
};

Sealed.args = {
  status: BadgeStatusCode.SEALED,
};

Refused.args = {
  status: BadgeStatusCode.REFUSED,
};
