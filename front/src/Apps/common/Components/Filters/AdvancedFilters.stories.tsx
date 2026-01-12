import { Meta, StoryObj } from "@storybook/react-vite";
import AdvancedFilters from "./AdvancedFilters";
import { FilterType } from "./filtersTypes";

const meta: Meta<typeof AdvancedFilters> = {
  component: AdvancedFilters
};
export default meta;

type Story = StoryObj<typeof AdvancedFilters>;

const values = {};
const onApplyFilters = _ => {};

export const Primary: Story = {
  args: {
    open: true,
    filters: [
      [
        {
          name: "types",
          label: "type de bordereau",
          type: FilterType.select,
          isActive: true,
          isMultiple: true,
          options: [
            {
              value: "bsdd",
              label: "Déchets Dangereux"
            },
            {
              value: "bsdasri",
              label: "Déchets d'Activités de Soins à Risques Infectieux"
            }
          ]
        },
        {
          name: "waste",
          label: "Code déchet",
          type: FilterType.input,
          isActive: true
        }
      ]
    ],
    onApplyFilters: () => onApplyFilters(values)
  }
};
