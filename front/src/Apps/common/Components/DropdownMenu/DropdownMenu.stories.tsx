import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import DropdownMenu from "./DropdownMenu";
import { MemoryRouter, Route } from "react-router-dom";

export default {
  title: "COMPONENTS/COMMON/DropdownMenu",
  component: DropdownMenu,
  decorators: [
    Story => (
      <MemoryRouter>
        <Route>
          <Story />
        </Route>
      </MemoryRouter>
    )
  ],
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?node-id=2864%3A543748&t=AnkIpzoWgu1o8Cbc-4"
  }
} as ComponentMeta<typeof DropdownMenu>;

const Template: ComponentStory<typeof DropdownMenu> = args => (
  <DropdownMenu {...args} />
);

export const Primary = Template.bind({});

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

Primary.args = {
  links,
  menuTitle: "the title"
};
