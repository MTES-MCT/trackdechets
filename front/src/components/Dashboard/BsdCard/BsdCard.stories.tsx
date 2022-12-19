import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import BsdCard from "./BsdCard";
import bsddMockJson from "../../../__mocks__/bsdd.json";
import { Form } from "generated/graphql/types";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard",
  component: BsdCard,
} as ComponentMeta<typeof BsdCard>;

const Template: ComponentStory<typeof BsdCard> = args => <BsdCard {...args} />;

export const Bsdd = Template.bind({});

const bsddJson = JSON.stringify(bsddMockJson);
let bsddParsed = JSON.parse(bsddJson);
const bsddMock = bsddParsed as Form;

Bsdd.args = {
  bsd: bsddMock,
};
