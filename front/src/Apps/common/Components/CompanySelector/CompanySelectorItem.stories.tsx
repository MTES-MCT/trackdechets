import { Meta, StoryObj } from "@storybook/react-vite";
import CompanySelectorItem from "./CompanySelectorItem";
import { fn } from "storybook/test";

const meta: Meta<typeof CompanySelectorItem> = {
  component: CompanySelectorItem
};
export default meta;

type Story = StoryObj<typeof CompanySelectorItem>;

export const Primary: Story = {
  args: {
    onSelect: fn(),
    company: {
      siret: "11111111111111",
      orgId: "11111111111111",
      address: "rue de Kronstadt",
      name: "Entreprise test",
      isRegistered: true
    }
  }
};
