import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import Badge from "./Badge";
import { BsdStatusCode } from "../../../common/types/bsdTypes";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/Badge",
  component: Badge,
  argTypes: {
    status: {
      control: "select",
      options: Object.values(BsdStatusCode)
    }
  }
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
  status: BsdStatusCode.Draft
};

Initial.args = {
  status: BsdStatusCode.Initial,
  isDraft: true
};

InitialNotDraft.args = {
  status: BsdStatusCode.Initial,
  isDraft: false
};
InitialDasriNotDraft.args = {
  status: BsdStatusCode.Initial,
  isDraft: false
};

Received.args = {
  status: BsdStatusCode.Received
};

Processed.args = {
  status: BsdStatusCode.Processed
};

Sealed.args = {
  status: BsdStatusCode.Sealed
};

Refused.args = {
  status: BsdStatusCode.Refused
};
