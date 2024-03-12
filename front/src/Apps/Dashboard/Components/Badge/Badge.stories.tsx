import { Meta, StoryObj } from "@storybook/react";
import Badge from "./Badge";
import { BsdStatusCode } from "../../../common/types/bsdTypes";

const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    status: {
      control: "select",
      options: Object.values(BsdStatusCode)
    }
  }
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const DraftBsdd: Story = {
  args: {
    status: BsdStatusCode.Draft
  }
};

export const Initial: Story = {
  args: {
    status: BsdStatusCode.Initial,
    isDraft: true
  }
};

export const InitialNotDraft: Story = {
  args: {
    status: BsdStatusCode.Initial,
    isDraft: false
  }
};

export const InitialDasriNotDraft: Story = {
  args: {
    status: BsdStatusCode.Initial,
    isDraft: false
  }
};

export const Received: Story = {
  args: {
    status: BsdStatusCode.Received
  }
};

export const Processed: Story = {
  args: {
    status: BsdStatusCode.Processed
  }
};

export const Sealed: Story = {
  args: {
    status: BsdStatusCode.Sealed
  }
};

export const Refused: Story = {
  args: {
    status: BsdStatusCode.Refused
  }
};
