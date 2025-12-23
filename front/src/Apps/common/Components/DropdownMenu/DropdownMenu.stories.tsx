import React from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import DropdownMenu from "./DropdownMenu";
import { MemoryRouter, Route } from "react-router-dom";

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
  decorators: [
    Story => (
      <MemoryRouter>
        <Route element={<Story />} />
      </MemoryRouter>
    )
  ]
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

const links = [
  {
    route: "/dashboard/create/some-route",
    title: "Some route"
  },
  {
    route: "/dashboard/create/some-other-route",
    title: "Some other route"
  }
];

export const Primary: Story = {
  args: { links, menuTitle: "the title" }
};
