import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Bsd } from "generated/graphql/types";
import { MemoryRouter, Route } from "react-router";

import BsdCardList from "./BsdCardList";
import bsddListDraft from "../../../__mocks__/bsdListDraft.json";
import bsdListActJson from "../../../__mocks__/bsdListAct.json";
import bsdListFollowJson from "../../../__mocks__/bsdListFollow.json";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCardList",
  component: BsdCardList,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2418&t=MpuaN0XSsy6M6dxe-4",
  },
  decorators: [
    Story => (
      <MemoryRouter initialEntries={["/dashboard/53230142100022"]}>
        <Route path="/dashboard/:siret/">
          <Story />
        </Route>
      </MemoryRouter>
    ),
  ],
} as ComponentMeta<typeof BsdCardList>;

const Template: ComponentStory<typeof BsdCardList> = args => (
  <BsdCardList {...args} />
);

export const BsddCardListDraft = Template.bind({});
export const BsddCardListAct = Template.bind({});
export const BsddCardListFollow = Template.bind({});

BsddCardListDraft.args = {
  bsds: bsddListDraft as unknown as { node: Bsd }[],
};
BsddCardListAct.args = {
  bsds: bsdListActJson as unknown as { node: Bsd }[],
};
BsddCardListFollow.args = {
  bsds: bsdListFollowJson as unknown as { node: Bsd }[],
};
