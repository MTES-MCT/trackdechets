import sendInBlueBackend from "../backends/sendInBlueBackend";
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

import { Mail } from "../types";
const mail: Mail = {
  to: [{ name: "Max La Menace", email: "max@lamenace.cia" }],

  subject: "lorem ipsum",
  body: "<p>Donéc non massa pretïum</p>",

  templateId: 33,
  attachment: { file: "base64abc", name: "file.pdf" },
  vars: { foo: "bar" }
};

const batchMail: Mail = {
  messageVersions: [
    {
      to: [{ name: "name1", email: "email1@mail.com" }],
      htmlContent: "htmlContent1",
      subject: "subject1"
    },
    {
      to: [{ name: "name2", email: "email2@mail.com" }],
      htmlContent: "htmlContent2",
      subject: "subject2"
    }
  ],
  subject: "lorem ipsum",
  body: "<p>Donéc non massa pretïum</p>",

  templateId: 33,
  attachment: { file: "base64abc", name: "file.pdf" },
  vars: { foo: "bar" }
};

describe("sendInBlue backend", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should send sib api call", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    sendInBlueBackend.sendMail(mail);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const args: any = mockedAxiosPost.mock.calls;

    // right service was called

    expect(args[0][0]).toEqual("http://mailservice/smtp/email");
    const payload = args[0][1];
    expect(payload.to[0].email).toEqual("max@lamenace.cia");
    expect(payload.templateId).toEqual(33);
    expect(payload.params.body).toEqual("<p>Donéc non massa pretïum</p>");
    expect(payload.attachment).toEqual([
      {
        content: "base64abc",
        name: "file.pdf"
      }
    ]);
  });

  it("should correctly serialize messageVersions", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    sendInBlueBackend.sendMail(batchMail);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const args: any = mockedAxiosPost.mock.calls;

    // right service was called

    expect(args[0][0]).toEqual("http://mailservice/smtp/email");

    const payload = args[0][1];
    // regular stuff
    expect(payload.templateId).toEqual(33);
    expect(payload.params.body).toEqual("<p>Donéc non massa pretïum</p>");
    expect(payload.attachment).toEqual([
      {
        content: "base64abc",
        name: "file.pdf"
      }
    ]);

    // message versions stuff
    expect(payload.messageVersions[0].to[0].name).toEqual("name1");
    expect(payload.messageVersions[0].to[0].email).toEqual("email1@mail.com");
    expect(payload.messageVersions[0].htmlContent).toEqual("htmlContent1");
    expect(payload.messageVersions[0].subject).toEqual("subject1");

    expect(payload.messageVersions[1].to[0].name).toEqual("name2");
    expect(payload.messageVersions[1].to[0].email).toEqual("email2@mail.com");
    expect(payload.messageVersions[1].htmlContent).toEqual("htmlContent2");
    expect(payload.messageVersions[1].subject).toEqual("subject2");
  });
});
