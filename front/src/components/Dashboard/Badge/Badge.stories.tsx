import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { withDesign } from "storybook-addon-designs";
import Badge from "./Badge";
import { BsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdType } from "../../../generated/graphql/types";

export default {
  title: "COMPONENTS/DASHBOARD/Badge",
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
  status: BsdStatusCode.DRAFT,
};

Initial.args = {
  status: BsdStatusCode.INITIAL,
  isDraft: true,
};

InitialNotDraft.args = {
  status: BsdStatusCode.INITIAL,
  isDraft: false,
};
InitialDasriNotDraft.args = {
  status: BsdStatusCode.INITIAL,
  isDraft: false,
  bsdType: BsdType.Bsdasri,
};

Received.args = {
  status: BsdStatusCode.RECEIVED,
};

Processed.args = {
  status: BsdStatusCode.PROCESSED,
};

Sealed.args = {
  status: BsdStatusCode.SEALED,
};

Refused.args = {
  status: BsdStatusCode.REFUSED,
};
