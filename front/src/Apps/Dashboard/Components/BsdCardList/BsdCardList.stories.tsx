import React from "react";
import { Meta, StoryObj } from "@storybook/react-vite";

import { MemoryRouter, Route } from "react-router-dom";
import { BsdEdge } from "@td/codegen-ui";

import BsdCardList from "./BsdCardList";
import bsdListDraft from "../../__mocks__/bsdListDraft.json";
import bsdListActJson from "../../__mocks__/bsdListAct.json";
import bsdListFollowJson from "../../__mocks__/bsdListFollow.json";
import bsdListArchiveJson from "../../__mocks__/bsdListArchive.json";
import { BsdCurrentTab } from "../../../common/types/commonTypes";

const meta: Meta<typeof BsdCardList> = {
  component: BsdCardList,
  decorators: [
    Story => (
      <MemoryRouter>
        <Route element={<Story />} />
      </MemoryRouter>
    )
  ]
};
export default meta;

type Story = StoryObj<typeof BsdCardList>;

const siret = "53230142100022"; // les ateliers de céline
const bsdCurrentTab: BsdCurrentTab = "draftTab";

export const Brouillon: Story = {
  args: {
    siret: siret,
    bsds: bsdListDraft as unknown as BsdEdge[],
    bsdCurrentTab
  }
};

export const PourAction: Story = {
  args: {
    siret: siret,
    bsds: bsdListActJson as unknown as BsdEdge[],
    bsdCurrentTab
  }
};

export const Suvi: Story = {
  args: {
    siret: "13001045700013", // dreal
    bsds: bsdListFollowJson as unknown as BsdEdge[],
    bsdCurrentTab
  }
};

export const Archives: Story = {
  args: {
    siret: siret,
    bsds: bsdListArchiveJson as unknown as BsdEdge[],
    bsdCurrentTab
  }
};
