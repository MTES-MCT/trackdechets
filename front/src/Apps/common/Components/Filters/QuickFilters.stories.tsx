import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import QuickFilters from "./QuickFilters";
import { FilterType } from "./filtersTypes";

export default {
  title: "COMPONENTS/COMMON/QuickFilters",
  component: QuickFilters,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?node-id=2864%3A543748&t=AnkIpzoWgu1o8Cbc-4"
  }
} as ComponentMeta<typeof QuickFilters>;

const Template: ComponentStory<typeof QuickFilters> = args => (
  <QuickFilters {...args} />
);

export const Primary = Template.bind({});
const values = {};
const onApplyFilters = _ => {};

Primary.args = {
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
};
