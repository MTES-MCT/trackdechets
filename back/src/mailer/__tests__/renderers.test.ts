import { MailTemplate } from "../types";
import { renderMail } from "../templates/renderers";

const to = [{ name: "John Snow", email: "john.snow@trackdechets.fr" }];
const cc = [{ name: "Arya Stark", email: "arya.stark@trackdechets.fr" }];
const attachment = { name: "photo", file: "photo.jpeg" };

describe("renderMail", () => {
  it("should render template with subject and body template", () => {
    const mailTemplate: MailTemplate<{ name: string; pizza: string }> = {
      subject: ({ name }) => `Hello ${name}`,
      body: ({ pizza }) => `Discover our new pizza: ${pizza}`,
      templateId: 1
    };

    const mail = renderMail(mailTemplate, {
      variables: { name: "John", pizza: "Margarita" },
      to,
      cc,
      attachment
    });

    expect(mail.to).toEqual(to);
    expect(mail.cc).toEqual(cc);
    expect(mail.attachment).toEqual(attachment);
    expect(mail.subject).toEqual("Hello John");
    expect(mail.body).toEqual("Discover our new pizza: Margarita");
    expect(mail.templateId).toEqual(1);
  });

  it("should render template without body", () => {
    const mailTemplate: MailTemplate = {
      subject: "Hello",
      templateId: 1
    };
    const mail = renderMail(mailTemplate, {
      to
    });

    expect(mail.body).toEqual(undefined);
    expect(mail.subject).toEqual("Hello");
    expect(mail.templateId).toEqual(1);
  });

  it("should sanitize 'to' params", () => {
    const mailTemplate: MailTemplate = {
      subject: "Hello",
      templateId: 1
    };
    const mail = renderMail(mailTemplate, {
      to: [
        { name: "{{7*7}}", email: "john.<%turboH4ck%>@trackdechets.fr" },
        { name: "${{5*5}}", email: "foo.#{{turboH4ck}}@trackdechets.fr" }
      ]
    });

    expect(mail.to).toBeDefined();
    expect(mail.to![0]).toStrictEqual({
      name: "77",
      email: "john.turboH4ck@trackdechets.fr"
    });
    expect(mail.to![1]).toStrictEqual({
      name: "55",
      email: "foo.turboH4ck@trackdechets.fr"
    });
  });
});
