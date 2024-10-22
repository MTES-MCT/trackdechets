import sendInBlueBackend, {
  MESSAGE_VERSIONS_BULK_LIMIT
} from "../backends/sendInBlueBackend";
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

import { Mail } from "../types";
const mail: Mail = {
  to: [{ name: "Max La Menace", email: "max@lamenace.cia" }],

  subject: "lorem ipsum",
  body: "<p>Donéc non massa pretïum</p>",

  templateId: 33,
  attachment: { file: "base64abc", name: "file.pdf" }
};

const batchMail: Mail = {
  messageVersions: [
    {
      to: [{ name: "name1", email: "email1@mail.com" }],
      params: { body: "htmlContent1" },
      subject: "subject1"
    },
    {
      to: [{ name: "name2", email: "email2@mail.com" }],
      params: { body: "htmlContent2" },
      subject: "subject2"
    }
  ],
  subject: "lorem ipsum",
  body: "<p>Donéc non massa pretïum</p>",

  templateId: 33,
  attachment: { file: "base64abc", name: "file.pdf" }
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
    expect(payload.messageVersions[0].params.body).toEqual("htmlContent1");
    expect(payload.messageVersions[0].subject).toEqual("subject1");

    expect(payload.messageVersions[1].to[0].name).toEqual("name2");
    expect(payload.messageVersions[1].to[0].email).toEqual("email2@mail.com");
    expect(payload.messageVersions[1].params.body).toEqual("htmlContent2");
    expect(payload.messageVersions[1].subject).toEqual("subject2");
  });

  it("should split the mail into chunks if messageVersions is too big", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    const oversizedBatchMail = {
      ...batchMail,
      messageVersions: Array.from(
        Array(MESSAGE_VERSIONS_BULK_LIMIT + 10).keys()
      ).map(i => ({
        to: [{ name: `user${i}`, email: `user${i}@mail.com` }],
        params: { body: `htmlContent${i}` },
        subject: `subject${i}`
      }))
    };

    sendInBlueBackend.sendMail(oversizedBatchMail);

    // 2 batches should be sent, so axios should be called twice
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(2);

    const args: any = mockedAxiosPost.mock.calls;

    // right service was called

    expect(args[0][0]).toEqual("http://mailservice/smtp/email");
    expect(args[1][0]).toEqual("http://mailservice/smtp/email");

    const payload0 = args[0][1];

    // regular stuff
    expect(payload0.templateId).toEqual(33);
    expect(payload0.params.body).toEqual("<p>Donéc non massa pretïum</p>");
    expect(payload0.attachment).toEqual([
      {
        content: "base64abc",
        name: "file.pdf"
      }
    ]);

    // message versions stuff
    expect(payload0.messageVersions.length).toEqual(
      MESSAGE_VERSIONS_BULK_LIMIT
    );
    expect(payload0.messageVersions[0].to[0].name).toEqual("user0");
    expect(payload0.messageVersions[0].to[0].email).toEqual("user0@mail.com");
    expect(payload0.messageVersions[0].params.body).toEqual("htmlContent0");
    expect(payload0.messageVersions[0].subject).toEqual("subject0");

    const payload1 = args[1][1];

    // regular stuff
    expect(payload1.messageVersions.length).toEqual(10);
    expect(payload1.templateId).toEqual(33);
    expect(payload1.params.body).toEqual("<p>Donéc non massa pretïum</p>");
    expect(payload1.attachment).toEqual([
      {
        content: "base64abc",
        name: "file.pdf"
      }
    ]);

    // message versions stuff
    expect(payload1.messageVersions[0].to[0].name).toEqual("user950");
    expect(payload1.messageVersions[0].to[0].email).toEqual("user950@mail.com");
    expect(payload1.messageVersions[0].params.body).toEqual("htmlContent950");
    expect(payload1.messageVersions[0].subject).toEqual("subject950");
  });
});
