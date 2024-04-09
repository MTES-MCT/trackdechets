import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import CompanyContactForm from "./CompanyContactForm";

export default {
  title: "COMPONENTS/COMPANIES/CONTACT",
  component: CompanyContactForm,
  parameters: { actions: { argTypesRegex: "^on.*" } }
} as Meta<typeof CompanyContactForm>;

const Template: StoryFn<typeof CompanyContactForm> = args => (
  <CompanyContactForm {...args} />
);

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
