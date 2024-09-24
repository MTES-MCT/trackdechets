import { Meta, StoryObj } from "@storybook/react";
import QuickFilters from "./QuickFilters";
import { FilterType } from "./filtersTypes";

const meta: Meta<typeof QuickFilters> = {
  component: QuickFilters
};
export default meta;

type Story = StoryObj<typeof QuickFilters>;

const values = {};
const onApplyFilters = _ => {};

export const Primary: Story = {
  args: {
    filters: [
      {
        name: "waste",
        label: "Code déchet",
        type: FilterType.input,
        isActive: true
      },
      {
        name: "givenName",
        label: "Raison sociale / SIRET",
        type: FilterType.input,
        isActive: true
      }
    ],
    onApplyFilters: () => onApplyFilters(values)
  }
};
