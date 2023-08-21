import { Meta, StoryObj } from "@storybook/react";
import CompanySelectorItem from "./CompanySelectorItem";

const meta: Meta<typeof CompanySelectorItem> = {
  component: CompanySelectorItem,
};
export default meta;

type Story = StoryObj<typeof CompanySelectorItem>;

export const Default: Story = {
  args: {
    selected: false,
  },
};
