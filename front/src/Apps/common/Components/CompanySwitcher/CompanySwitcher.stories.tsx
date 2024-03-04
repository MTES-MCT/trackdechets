import { Meta, StoryObj } from "@storybook/react";
import CompanySwitcher from "./CompanySwitcher";

const meta: Meta<typeof CompanySwitcher> = { component: CompanySwitcher };
export default meta;

type Story = StoryObj<typeof CompanySwitcher>;

export const Primary: Story = {
  args: {}
};
