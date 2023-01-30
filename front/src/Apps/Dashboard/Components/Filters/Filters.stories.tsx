import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import Filters from "./Filters";
import { FilterType } from "./filtersTypes";

export default {
  title: "COMPONENTS/DASHBOARD/Filters",
  component: Filters,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?node-id=2864%3A543748&t=AnkIpzoWgu1o8Cbc-4",
  },
} as ComponentMeta<typeof Filters>;

const Template: ComponentStory<typeof Filters> = args => <Filters {...args} />;

export const Primary = Template.bind({});
const values = {};
const onApplyFilters = values => {};

Primary.args = {
  filters: [
    {
      value: "types",
      order: "type",
      label: "type de bordereau",
      type: FilterType.select,
      options: [
        {
          value: "bsdd",
          label: "Déchets Dangereux",
        },
        {
          value: "bsdasri",
          label: "Déchets d'Activités de Soins à Risque Infectieux",
        },
      ],
    },
    {
      value: "waste",
      order: "wasteCode",
      label: "Code déchet",
      type: FilterType.input,
    },
  ],
  onApplyFilters: () => onApplyFilters(values),
};
