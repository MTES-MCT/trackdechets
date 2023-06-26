import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Bsdasri } from "generated/graphql/types";

import BsdCard from "./BsdCard";
import { BsdCurrentTab } from "Apps/common/types/commonTypes";

export default {
  title: "COMPONENTS/DASHBOARD/BsdCard",
  component: BsdCard,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/tyefue5qFChEpujrFU1Jiz/Librairie-TD-dashboard?node-id=1%3A2420&t=0tYb1cF2o4m4Id2g-4",
  },
} as ComponentMeta<typeof BsdCard>;

const Template: ComponentStory<typeof BsdCard> = args => <BsdCard {...args} />;

export const BsdCardExample = Template.bind({});

const currentSiret = "53230142100022";
const onValidate = jest.fn();
const bsdCurrentTab: BsdCurrentTab = "actTab";

BsdCardExample.args = {
  bsd: {
    id: "DASRI-20220603-CFZ337QCS",
    bsdasriStatus: "SENT",
    type: "SIMPLE",
    isDraft: false,
    bsdasriWaste: {
      code: "18 01 03*",
      __typename: "BsdasriWaste",
    },
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
    ecoOrganisme: {
      siret: "79250555400032",
      emittedByEcoOrganisme: true,
      __typename: "BsdasriEcoOrganisme",
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
        __typename: "BsdasriTransport",
      },
      __typename: "BsdasriTransporter",
    },
    destination: {
      company: {
        name: "L'ATELIER DE CELINE",
        orgId: "53230142100022",
        siret: "53230142100022",
        vatNumber: null,
        omiNumber: null,
        __typename: "FormCompany",
      },
      __typename: "BsdasriDestination",
    },
    grouping: [],
    synthesizing: [],
    createdAt: "2022-06-03T07:12:29.490Z",
    updatedAt: "2022-06-03T07:16:40.015Z",
    allowDirectTakeOver: false,
    synthesizedIn: {
      id: "DASRI-20220603-V61NMBREF",
      __typename: "Bsdasri",
    },
    __typename: "Bsdasri",
  } as unknown as Bsdasri,
  currentSiret,
  onValidate,
  bsdCurrentTab,
};
