import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import InfoWithIcon from "./InfoWithIcon";
import { InfoIconCode } from "./infoWithIconTypes";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/InfoWithIcon",
  component: InfoWithIcon,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2431&t=0tYb1cF2o4m4Id2g-4"
  }
} as ComponentMeta<typeof InfoWithIcon>;

const Template: ComponentStory<typeof InfoWithIcon> = args => (
  <InfoWithIcon {...args} />
);

export const EntreposageProvisoire = Template.bind({});
export const DateDeDerniereModification = Template.bind({});
export const EcoOrganisme = Template.bind({});
export const CustomInfo = Template.bind({});
export const TransporterNumberPlate = Template.bind({});

EntreposageProvisoire.args = {
  labelCode: InfoIconCode.TempStorage
};
DateDeDerniereModification.args = {
  labelCode: InfoIconCode.LastModificationDate,
  info: "21/12/2022"
};
EcoOrganisme.args = {
  labelCode: InfoIconCode.EcoOrganism
};
CustomInfo.args = {
  labelCode: InfoIconCode.CustomInfo
};
TransporterNumberPlate.args = {
  labelCode: InfoIconCode.TransporterNumberPlate
};
