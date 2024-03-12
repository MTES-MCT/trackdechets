import { Meta, StoryObj } from "@storybook/react";
import SurveyBanner from "./SurveyBanner";

const meta: Meta<typeof SurveyBanner> = {
  component: SurveyBanner
};
export default meta;

type Story = StoryObj<typeof SurveyBanner>;

export const Primary: Story = {
  args: {
    message:
      "Afin de mesurer votre ressenti vis à vis de l'application Trackdéchets, nous vous invitons à répondre à ce questionnaire.",
    button: {
      title: "Répondre au questionnaire",
      href: "https://trackdechets.beta.gouv.fr"
    }
  }
};
