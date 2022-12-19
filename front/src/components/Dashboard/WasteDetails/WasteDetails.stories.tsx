import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import WasteDetails from "./WasteDetails";
import { BsdType } from "../../../generated/graphql/types";

export default {
  title: "COMPONENTS/DASHBOARD/WasteDetails",
  component: WasteDetails,
} as ComponentMeta<typeof WasteDetails>;

const Template: ComponentStory<typeof WasteDetails> = args => (
  <WasteDetails {...args} />
);

export const Bsdd = Template.bind({});
export const Bsda = Template.bind({});
export const Bsff = Template.bind({});
export const Bsdasri = Template.bind({});
export const Bsvhu = Template.bind({});

Bsdd.args = {
  wasteType: BsdType.Bsdd,
  code: "01 01*",
  name: "le déchet dangereux",
  weight: "450 t",
};

Bsda.args = {
  wasteType: BsdType.Bsda,
  code: "01 01*",
  name: "le déchet amiante",
  weight: "450 t",
};

Bsff.args = {
  wasteType: BsdType.Bsff,
  code: "01 01*",
  name: "le déchet fluide frigorigène",
  weight: "450 t",
};

Bsdasri.args = {
  wasteType: BsdType.Bsdasri,
  code: "01 01*",
  name: "le déchet d'activités de soins à risques infectieux",
  weight: "450 t",
};

Bsvhu.args = {
  wasteType: BsdType.Bsvhu,
  code: "01 01*",
  name: "le déchet véhicule hors usage",
  weight: "450 t",
};
