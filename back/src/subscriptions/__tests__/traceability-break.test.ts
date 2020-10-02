import axios from "axios";

import { FormSubscriptionPayload } from "../../generated/prisma-client";
import { formsSubscriptionCallback } from "../forms";

const mockedForm = {
  readableId: "readable_id",
  wasteDetailsName: "wate_name",
  wasteDetailsCode: "waste_code",
  emitterCompanyMail: "emitter_email",
  emitterCompanyContact: "emitter_contact",
  recipientCompanyMail: "recipient_mail",
  recipientCompanyContact: "recipient_contact",
  recipientCompanyName: "recipient_name"
};

jest.mock("../../generated/prisma-client", () => ({
  prisma: {
    form: jest.fn(() => mockedForm)
  }
}));

describe("mailWhenFormTraceabilityIsBroken", () => {
  it("should send a request to td mail service when form traceability is broken", async () => {
    const formPayload: FormSubscriptionPayload = {
      node: {
        id: "xyz12345",
        readableId: "TD-xxx",
        isImportedFromPaper: false,
        status: "NO_TRACEABILITY",
        createdAt: "2019-10-16T07:45:13.959Z",
        updatedAt: "2019-10-16T07:45:13.959Z",
        noTraceability: true
      },
      updatedFields: ["noTraceability"],
      mutation: "UPDATED",
      previousValues: {
        id: "xyz12345",
        readableId: "TD-xxx",
        isImportedFromPaper: false,
        status: "RECEIVED",
        createdAt: "2019-10-16T07:45:13.959Z",
        updatedAt: "2019-10-16T07:45:13.959Z"
      }
    };

    const mockedAxiosPost = jest.spyOn(axios, "post");
    mockedAxiosPost.mockResolvedValue({} as any);

    await formsSubscriptionCallback(formPayload);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const postArgs = mockedAxiosPost.mock.calls[0];

    expect(postArgs[0]).toEqual("http://td-mail/send");

    const payload = postArgs[1];

    // Check To & Cc
    expect(payload.to[0].email).toEqual(mockedForm.emitterCompanyMail);
    expect(payload.to[0].name).toEqual(mockedForm.emitterCompanyContact);

    expect(payload.cc[0].email).toEqual(mockedForm.recipientCompanyMail);
    expect(payload.cc[0].name).toEqual(mockedForm.recipientCompanyContact);

    // check mail body infos
    expect(payload.body).toContain(mockedForm.readableId);
    expect(payload.body).toContain(mockedForm.recipientCompanyName);
    expect(payload.body).toContain(mockedForm.wasteDetailsName);
    expect(payload.body).toContain(mockedForm.wasteDetailsCode);
  });
});
