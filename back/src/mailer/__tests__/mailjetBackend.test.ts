import mailjetBackend from "../backends/mailjetBackend";

import superagentMock from "superagent-mock";
import mockConfig from "./mockconfig";
import superagent from "superagent"; // eslint-disable-line import/no-extraneous-dependencies
import { Mail } from "../types";
const mail: Mail = {
  to: [{ name: "Max La Menace", email: "max@lamenace.cia" }],

  subject: "lorem ipsum",
  title: "dolor sit",
  body: "<p>Donéc non massa pretïum</p>",

  templateId: 33,
  attachment: { file: "base64abc", name: "file.pdf" },
  vars: { foo: "bar" }
};

const logger = (function () {
  const logs = [];
  function log(val) {
    logs.push(val);
  }
  return {
    log: function (v) {
      log(v);
    },

    logs: function () {
      return logs;
    }
  };
})();

let agent;

describe("mailjetBackend backend", () => {
  beforeAll(() => {
    agent = superagentMock(superagent, mockConfig, logger.log);
  });

  afterAll(() => {
    agent.unset();
  });

  it("should send mj api call", () => {
    mailjetBackend.sendMail(mail);

    const logs = logger.logs();
    expect(logs.length).toEqual(1);
    expect(logs[0].matcher).toEqual("https://api.mailjet.com/v3.1/send");
    expect(logs[0].method).toEqual("POST");

    expect(logs[0].data.Messages[0].To[0]).toEqual({
      name: "Max La Menace",
      email: "max@lamenace.cia"
    });
    expect(logs[0].data.Messages[0].TemplateId).toEqual(33);
    expect(logs[0].data.Messages[0].TemplateLanguage).toBe(true);
    expect(logs[0].data.Messages[0].Variables.foo).toEqual("bar");
    expect(logs[0].data.Messages[0].Subject).toEqual("lorem ipsum");

    expect(logs[0].data.Messages[0].Attachments[0]).toEqual({
      ContentType: "application/pdf",
      Filename: "file.pdf",
      Base64Content: "base64abc"
    });
  });
});
