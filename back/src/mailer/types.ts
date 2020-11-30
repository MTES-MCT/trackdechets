type Attachment = {
  name: string;
  file: string;
};
type Recipient = {
  name: string;
  email: string;
};
export type Mail = {
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  title: string;
  body: string;
  baseUrl?: string;
  templateId?: number;
  attachment?: Attachment;
  vars?: { [id: string]: any };
};
export type Contact = {
  email: string;
  name: string;
};
