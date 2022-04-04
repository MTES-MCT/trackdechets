import fs from "fs";
import path from "path";
import mustache from "mustache";
import { getUIBaseURL, getAPIBaseURL } from "../../utils";
import { Attachment, Mail, MailTemplate, Recipient } from "../types";

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

type MailRendererInput<V> = {
  to: Recipient[];
  cc?: Recipient[];
  attachment?: Attachment;
  variables?: V;
};

// These variables will be made available to all templates
const context = { UI_URL: getUIBaseURL(), API_URL: getAPIBaseURL() };

/**
 * Render a mail definition into a fully featured mail that can
 * be passed to the mail backend
 */
export function renderMail<V>(
  mailTemplate: MailTemplate<V>,
  { variables, ...mailProps }: MailRendererInput<V>
): Mail {
  const { prepareVariables } = mailTemplate;

  const preparedVariables = prepareVariables
    ? prepareVariables(variables)
    : variables;

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
    ...mailProps,
    vars // pass vars to mail provider
  };
}
