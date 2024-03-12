import { Meta, StoryObj } from "@storybook/react";
import CompanySelector from "./CompanySelector";
import { fn } from "@storybook/test";

const meta: Meta<typeof CompanySelector> = {
  component: CompanySelector
};
export default meta;

type Story = StoryObj<typeof CompanySelector>;

export const Primary: Story = {
  args: {
    loading: false,
    onSearch: fn(),
    onSelect: fn(),
    companies: [
      {
        siret: "11111111111111",
        orgId: "11111111111111",
        address: "rue de Kronstadt",
        name: "Entreprise test",
        isRegistered: true
      },
      {
        siret: "22222222222222",
        orgId: "22222222222222",
        address: "rue des 4 chemins",
        name: "Déchetterie de Carolles",
        isRegistered: true
      },
      {
        siret: "33333333333333",
        orgId: "33333333333333",
        address: "Chemin des pécheurs",
        name: "Entreprise test",
        isRegistered: true
      },
      {
        siret: "44444444444444",
        orgId: "44444444444444",
        address: "rue Simone de Beauvoir",
        name: "Transporteur Montreuil",
        isRegistered: true
      }
    ]
  }
};
