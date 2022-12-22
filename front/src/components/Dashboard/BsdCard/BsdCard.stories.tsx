import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form } from "generated/graphql/types";

import BsdCard from "./BsdCard";
import bsddMockJson from "../../../__mocks__/bsdd.json";
import bsddMockWithEntreposageJson from "../../../__mocks__/bsddWithEntreposage.json";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard",
  component: BsdCard,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2420&t=0tYb1cF2o4m4Id2g-4",
  },
} as ComponentMeta<typeof BsdCard>;

const Template: ComponentStory<typeof BsdCard> = args => <BsdCard {...args} />;

export const Bsdd = Template.bind({});
export const BsddAvecEntreposage = Template.bind({});
// export const BsddAvecAction = Template.bind({});

Bsdd.args = {
  bsd: bsddMockJson as unknown as Form,
};
BsddAvecEntreposage.args = {
  bsd: bsddMockWithEntreposageJson as unknown as Form,
};
/* BsddAvecAction.args = {
  bsd: bsdListForActionsJson[0].node as unknown as Bsda, // le payload diffère ??
}; */
