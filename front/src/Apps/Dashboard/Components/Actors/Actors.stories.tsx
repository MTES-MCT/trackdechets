import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Actors from "./Actors";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/Actors",
  component: Actors,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2420&t=0tYb1cF2o4m4Id2g-4"
  }
} as ComponentMeta<typeof Actors>;

const Template: ComponentStory<typeof Actors> = args => <Actors {...args} />;

export const List = Template.bind({});

List.args = {
  emitterName: "BOULANGERIE AU 148",
  transporterName:
    "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE"
};
