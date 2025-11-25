import React from "react";
import { Meta, StoryFn } from "@storybook/react-vite";
import { TransporterAccordion } from "./TransporterAccordion";

export default {
  title: "COMPONENTS/FORMS/TransporterAccordion",
  component: TransporterAccordion,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?type=design&node-id=4741-716782&mode=design&t=UxJIRtiJNCn9s5wf-4"
  }
} as Meta<typeof TransporterAccordion>;

const Template: StoryFn<typeof TransporterAccordion> = args => (
  <TransporterAccordion {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  name: "Transport qui roule",
  numero: 1,
  expanded: true,
  children: <div>Contenu du formulaire</div>
};
