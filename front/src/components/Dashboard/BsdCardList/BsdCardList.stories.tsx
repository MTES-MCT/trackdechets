import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Bsd } from "generated/graphql/types";

import BsdCardList from "./BsdCardList";
import bsdListDraft from "../../../__mocks__/bsdListDraft.json";
import bsdListActJson from "../../../__mocks__/bsdListAct.json";
import bsdListFollowJson from "../../../__mocks__/bsdListFollow.json";
import bsdListArchiveJson from "../../../__mocks__/bsdListArchive.json";

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

export const Brouillon = Template.bind({});
export const PourAction = Template.bind({});
export const Suvi = Template.bind({});
export const Archives = Template.bind({});
const siret = "53230142100022"; // les ateliers de céline
Brouillon.args = {
  siret: siret,
  bsds: bsdListDraft as unknown as { node: Bsd }[],
};
PourAction.args = {
  siret: siret,
  bsds: bsdListActJson as unknown as { node: Bsd }[],
};
Suvi.args = {
  siret: "13001045700013", // dreal
  bsds: bsdListFollowJson as unknown as { node: Bsd }[],
};
Archives.args = {
  siret: siret,
  bsds: bsdListArchiveJson as unknown as { node: Bsd }[],
};
