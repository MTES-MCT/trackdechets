import { Meta, StoryObj } from "@storybook/react-vite";

import WasteDetails from "./WasteDetails";
import { BsdType } from "@td/codegen-ui";

const meta: Meta<typeof WasteDetails> = {
  component: WasteDetails
};
export default meta;

type Story = StoryObj<typeof WasteDetails>;

export const Bsdd: Story = {
  args: {
    wasteType: BsdType.Bsdd,
    code: "01 01*",
    name: "le déchet dangereux"
  }
};

export const Bsda: Story = {
  args: {
    wasteType: BsdType.Bsda,
    code: "01 01*",
    name: "le déchet amiante"
  }
};

export const Bsff: Story = {
  args: {
    wasteType: BsdType.Bsff,
    code: "01 01*",
    name: "le déchet fluide frigorigène"
  }
};

export const Bsdasri: Story = {
  args: {
    wasteType: BsdType.Bsdasri,
    code: "01 01*",
    name: "le déchet d'activités de soins à risques infectieux"
  }
};

export const Bsvhu: Story = {
  args: {
    wasteType: BsdType.Bsvhu,
    code: "01 01*",
    name: "le déchet véhicule hors usage"
  }
};
