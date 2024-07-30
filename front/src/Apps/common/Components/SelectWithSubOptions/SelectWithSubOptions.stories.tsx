import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import SelectWithSubOptions from "./SelectWithSubOptions";
import { Option } from "../Select/Select";

const OPTIONS: Option[] = [
  {
    value: "OPTION1",
    label: "Option 1",
    options: [
      {
        value: "OPTION1.1",
        label: "Option 1.1"
      },
      {
        value: "OPTION1.2",
        label: "Option 1.2"
      }
    ]
  },
  {
    value: "OPTION2",
    label: "Option 2"
  },
  {
    value: "OPTION3",
    label: "Option 3",
    options: [
      {
        value: "OPTION3.1",
        label: "Option 3.1"
      },
      {
        value: "OPTION3.2",
        label: "Option 3.2",
        options: [
          {
            value: "OPTION3.2.1",
            label: "Option 3.2.1"
          },
          {
            value: "OPTION3.2.2",
            label: "Option 3.2.2"
          }
        ]
      }
    ]
  }
];

export default {
  title: "COMPONENTS/COMMON/SelectWithSubOptions",
  component: SelectWithSubOptions
} as ComponentMeta<typeof SelectWithSubOptions>;

const Template: ComponentStory<typeof SelectWithSubOptions> = args => (
  <SelectWithSubOptions {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  options: OPTIONS,
  onChange: () => {}
};
