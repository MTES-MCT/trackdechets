import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { withDesign } from "storybook-addon-designs";
import Badge from "./Badge";
import { BsdStatusCode } from "../../../Common/types/bsdTypes";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/Badge",
  component: Badge,
  decorators: [withDesign],
  argTypes: {
    status: {
      control: "select",
      options: Object.values(BsdStatusCode),
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2365&t=0tYb1cF2o4m4Id2g-4",
    },
  },
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = args => <Badge {...args} />;

export const DraftBsdd = Template.bind({});
export const Initial = Template.bind({});
export const InitialNotDraft = Template.bind({});
export const InitialDasriNotDraft = Template.bind({});
export const Received = Template.bind({});
export const Processed = Template.bind({});
export const Sealed = Template.bind({});
export const Refused = Template.bind({});

DraftBsdd.args = {
  status: BsdStatusCode.Draft,
};

Initial.args = {
  status: BsdStatusCode.Initial,
  isDraft: true,
};

InitialNotDraft.args = {
  status: BsdStatusCode.Initial,
  isDraft: false,
};
InitialDasriNotDraft.args = {
  status: BsdStatusCode.Initial,
  isDraft: false,
};

Received.args = {
  status: BsdStatusCode.Received,
};

Processed.args = {
  status: BsdStatusCode.Processed,
};

Sealed.args = {
  status: BsdStatusCode.Sealed,
};

Refused.args = {
  status: BsdStatusCode.Refused,
};
