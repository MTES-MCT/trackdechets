export type Attachment = {
  name: string;
  file: string;
};
export type Recipient = {
  name: string;
  email: string;
};

// Rendered email that can be passed to the mail backend
export type Mail = {
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  body: string;
  attachment?: Attachment;
  templateId: number;
  vars?: { [id: string]: any };
};

export type Contact = {
  email: string;
  name: string;
};

// Renderable email definition
export type MailTemplate<
  // type variables that should be passed to renderer
  // these variables will be made available to both mustache and provider template
  V = any
> = {
  subject: string | ((values: V) => string);
  // template from the mail provider (Mailjet, Sendinblue), used standalone or as layout in conjunction with body
  templateId: number;
  // optional body or body template to be used in conjunction with the LAYOUT templateId
  body?: string | ((values: V) => string);
  prepareVariables?: (variables: V) => any;
};
