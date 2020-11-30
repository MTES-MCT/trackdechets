import sendInBlueBackend from "../backends/sendInBlueBackend";
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

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

describe("sendInBlue backend", () => {
  it("should send sib api call", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    sendInBlueBackend.sendMail(mail);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const args = mockedAxiosPost.mock.calls;

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
});
