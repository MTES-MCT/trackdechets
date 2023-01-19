import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Actors from "./Actors";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard/Blocks/Actors",
  component: Actors,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2420&t=0tYb1cF2o4m4Id2g-4",
  },
} as ComponentMeta<typeof Actors>;

const Template: ComponentStory<typeof Actors> = args => <Actors {...args} />;

export const List = Template.bind({});

List.args = {
  emitter: {
    company: {
      name: "BOULANGERIE AU 148",
      orgId: "81232991000010",
      siret: "81232991000010",
      vatNumber: null,
      omiNumber: null,
      __typename: "FormCompany",
    },
    emission: {
      isTakenOverWithoutEmitterSignature: false,
      isTakenOverWithSecretCode: false,
      __typename: "BsdasriEmission",
    },
    __typename: "BsdasriEmitter",
  },

  transporter: {
    company: {
      name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
      orgId: "13001045700013",
      siret: "13001045700013",
      vatNumber: null,
      omiNumber: null,
      __typename: "FormCompany",
    },
    customInfo: "houlalalal",
    transport: {
      plates: ["obligé"],
    },
  },
};
