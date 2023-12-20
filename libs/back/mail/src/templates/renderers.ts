import fs from "fs";
import path from "path";
import mustache from "mustache";
import {
  Attachment,
  Mail,
  MailTemplate,
  MessageVersion,
  Recipient
} from "../types";
import { sanitize } from "../helpers";

const TEMPLATE_DIR = `${__dirname}/mustache`;

/**
 * Load a template string from the template folder
 */
function loadMustacheTemplate(filename: string) {
  return fs.readFileSync(path.join(TEMPLATE_DIR, filename), "utf-8");
}

/**
 * Factory method generating a renderer based on a mustache template file
 * Exemple:
 * const renderer = mustacheRenderer("myTemplate.html")
 * const body = renderer({ foo: "bar"})
 */
export function mustacheRenderer(filename: string) {
  const templateString = loadMustacheTemplate(filename);
  function render(variables) {
    return mustache.render(templateString, variables);
  }
  return render;
}

export type MailRendererInput<V> = {
  cc?: Recipient[];
  attachment?: Attachment;
  variables?: V;
} & (
  | // 'to' or 'messageVersions' are mandatory (one or the other)
  { messageVersions: MessageVersion[]; to?: never }
  | { to: Recipient[]; messageVersions?: never }
);

// These variables will be made available to all templates
const context = {
  UI_URL: `${process.env.UI_URL_SCHEME || "http"}://${process.env.UI_HOST}`,
  API_URL: `${process.env.API_URL_SCHEME || "http"}://${process.env.API_HOST}`
};

const sanitizeMailProps = props => {
  return {
    ...props,
    ...{
      to: props.to
        ? props.to.map(to => ({
            email: to.email,
            name: sanitize(to.name)
          }))
        : undefined
    }
  };
};

/**
 * Render a mail definition into a fully featured mail that can
 * be passed to the mail backend
 */
export function renderMail<V>(
  mailTemplate: MailTemplate<V>,
  { variables, ...mailProps }: MailRendererInput<V>
): Mail {
  const { prepareVariables } = mailTemplate;

  const preparedVariables =
    prepareVariables && variables ? prepareVariables(variables) : variables;

  const vars = { ...preparedVariables, ...context };

  const body =
    typeof mailTemplate.body === "function"
      ? mailTemplate.body(vars)
      : mailTemplate.body;

  const subject =
    typeof mailTemplate.subject === "function"
      ? mailTemplate.subject(vars)
      : mailTemplate.subject;

  return {
    body,
    subject,
    templateId: mailTemplate.templateId,
    ...sanitizeMailProps(mailProps),
    vars // pass vars to mail provider
  };
}
