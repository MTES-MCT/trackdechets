import { Meta, StoryObj } from "@storybook/react";
import Actors from "./Actors";

const meta: Meta<typeof Actors> = {
  component: Actors
};
export default meta;

type Story = StoryObj<typeof Actors>;

export const Primary: Story = {
  args: {
    emitterName: "BOULANGERIE AU 148",
    transporterName:
      "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE"
  }
};
