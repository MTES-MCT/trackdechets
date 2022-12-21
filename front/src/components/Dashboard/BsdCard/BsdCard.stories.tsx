import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import BsdCard from "./BsdCard";
import bsddMockJson from "../../../__mocks__/bsdd.json";
import bsddMockWithEntreposageJson from "../../../__mocks__/bsddWithEntreposage.json";
import { Form } from "generated/graphql/types";

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

const bsddJson = JSON.stringify(bsddMockJson);
let bsddParsed = JSON.parse(bsddJson);
const bsddMock = bsddParsed as Form;

const bsddWithEntreposageJson = JSON.stringify(bsddMockWithEntreposageJson);
let bsddWithEntreposageParsed = JSON.parse(bsddWithEntreposageJson);
const bsddWithEntreposageMock = bsddWithEntreposageParsed as Form;

Bsdd.args = {
  bsd: bsddMock,
};
BsddAvecEntreposage.args = {
  bsd: bsddWithEntreposageMock,
};
