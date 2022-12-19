import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { withDesign } from "storybook-addon-designs";
import Badge from "./Badge";
import { BadgeStatusCode } from "./badgeTypes";

export default {
  title: "COMPONENTS/DASHBOARD/Badge",
  component: Badge,
  decorators: [withDesign],
  argTypes: {
    status: {
      control: "select",
      options: Object.values(BadgeStatusCode),
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=266%3A12457",
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
