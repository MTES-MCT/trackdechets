import { Meta } from "@storybook/react";
import CompanySelectorItem from "./CompanySelectorItem";
import { fn } from "@storybook/test";

const meta: Meta<typeof CompanySelectorItem> = {
  component: CompanySelectorItem,
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
export default meta;
