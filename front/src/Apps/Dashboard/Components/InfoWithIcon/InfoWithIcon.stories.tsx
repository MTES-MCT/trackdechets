import { Meta, StoryObj } from "@storybook/react-vite";
import InfoWithIcon from "./InfoWithIcon";
import { InfoIconCode } from "./infoWithIconTypes";

const meta: Meta<typeof InfoWithIcon> = {
  component: InfoWithIcon
};
export default meta;

type Story = StoryObj<typeof InfoWithIcon>;

export const EntreposageProvisoire: Story = {
  args: { labelCode: InfoIconCode.TempStorage }
};

export const DateDeDerniereModification: Story = {
  args: { labelCode: InfoIconCode.LastModificationDate, info: "21/12/2022" }
};

export const EcoOrganisme: Story = {
  args: { labelCode: InfoIconCode.EcoOrganism }
};

export const CustomInfo: Story = {
  args: { labelCode: InfoIconCode.CustomInfo }
};

export const TransporterNumberPlate: Story = {
  args: { labelCode: InfoIconCode.TransporterNumberPlate }
};
