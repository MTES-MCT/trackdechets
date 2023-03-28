import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import SurveyBanner from "./SurveyBanner";

export default {
  title: "COMPONENTS/COMMON/SurveyBanner",
  component: SurveyBanner,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?node-id=4103%3A638993&t=NPGgwiXVBEixD6bA-1",
  },
} as ComponentMeta<typeof SurveyBanner>;

const Template: ComponentStory<typeof SurveyBanner> = args => (
  <SurveyBanner {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  message:
    "Afin de mesurer votre ressenti vis à vis de l'application Trackdéchets, nous vous invitons à répondre à ce questionnaire.",
  button: {
    title: "Répondre au questionnaire",
    href: "https://trackdechets.beta.gouv.fr",
  },
  onClickClose: () => {
    console.log("Fermer la fenêtre");
  },
};
