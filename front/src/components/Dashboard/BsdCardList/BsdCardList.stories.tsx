import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Bsd } from "generated/graphql/types";

import BsdCardList from "./BsdCardList";
import bsddListDraft from "../../../__mocks__/bsdListDraft.json";
import bsdListActJson from "../../../__mocks__/bsdListAct.json";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCardList",
  component: BsdCardList,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2418&t=MpuaN0XSsy6M6dxe-4",
  },
} as ComponentMeta<typeof BsdCardList>;

const Template: ComponentStory<typeof BsdCardList> = args => (
  <BsdCardList {...args} />
);

export const BsddCardListDraft = Template.bind({});
export const BsddCardListAct = Template.bind({});

BsddCardListDraft.args = {
  bsds: bsddListDraft as unknown as { node: Bsd }[],
};
BsddCardListAct.args = {
  bsds: bsdListActJson as unknown as { node: Bsd }[],
};
