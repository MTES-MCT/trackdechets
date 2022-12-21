import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import LabelWithIcon from "./LabelWithIcon";
import { LabelIconCode } from "./labelWithIconTypes";

export default {
  title: "COMPONENTS/DASHBOARD/LabelWithIcon",
  component: LabelWithIcon,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2431&t=0tYb1cF2o4m4Id2g-4",
  },
} as ComponentMeta<typeof LabelWithIcon>;

const Template: ComponentStory<typeof LabelWithIcon> = args => (
  <LabelWithIcon {...args} />
);

export const EntreposageProvisoire = Template.bind({});
export const DateDeDerniereModification = Template.bind({});
export const EcoOrganisme = Template.bind({});

EntreposageProvisoire.args = {
  labelCode: LabelIconCode.TempStorage,
};
DateDeDerniereModification.args = {
  labelCode: LabelIconCode.LastModificationDate,
  date: "21/12/2022",
};
EcoOrganisme.args = {
  labelCode: LabelIconCode.EcoOrganism,
};
