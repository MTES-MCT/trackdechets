import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import WasteDetails from "./WasteDetails";
import { BsdType } from "@td/codegen-ui";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/WasteDetails",
  component: WasteDetails,
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2441&t=0tYb1cF2o4m4Id2g-4"
    }
  }
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
  name: "le déchet dangereux"
};

Bsda.args = {
  wasteType: BsdType.Bsda,
  code: "01 01*",
  name: "le déchet amiante"
};

Bsff.args = {
  wasteType: BsdType.Bsff,
  code: "01 01*",
  name: "le déchet fluide frigorigène"
};

Bsdasri.args = {
  wasteType: BsdType.Bsdasri,
  code: "01 01*",
  name: "le déchet d'activités de soins à risques infectieux"
};

Bsvhu.args = {
  wasteType: BsdType.Bsvhu,
  code: "01 01*",
  name: "le déchet véhicule hors usage"
};
