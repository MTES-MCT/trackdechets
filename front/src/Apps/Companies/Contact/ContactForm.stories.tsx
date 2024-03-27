import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import ContactForm from "./ContactForm";

export default {
  title: "COMPONENTS/COMPANIES/CONTACT",
  component: ContactForm,
  parameters: { actions: { argTypesRegex: "^on.*" } }
} as Meta<typeof ContactForm>;

const Template: StoryFn<typeof ContactForm> = args => <ContactForm {...args} />;

export const ContactNotEditable = Template.bind({});
export const ContactEditable = Template.bind({});

ContactNotEditable.args = {
  company: {
    contact: "contact",
    contactEmail: "email",
    contactPhone: "0123456789",
    website: ""
  } as unknown as CompanyPrivate
};
ContactEditable.args = {
  company: {
    contact: "contact",
    contactEmail: "email",
    contactPhone: "0123456789",
    website: "",
    userRole: UserRole.Admin
  } as unknown as CompanyPrivate
};
