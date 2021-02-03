import { Form } from "@prisma/client";
import * as mailing from "../../mailer/mailing";
import { TDEventPayload } from "../emitter";

import { formsEventCallback } from "../forms";

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

jest.mock("../../prisma", () => ({
  form: { findUnique: jest.fn(() => mockedForm) }
}));

describe("mailWhenFormTraceabilityIsBroken", () => {
  it("should send a request to td mail service when form traceability is broken", async () => {
    const formPayload: TDEventPayload<Form> = {
      node: {
        id: "xyz12345",
        readableId: "TD-xxx",
        isImportedFromPaper: false,
        status: "NO_TRACEABILITY",
        createdAt: new Date("2019-10-16T07:45:13.959Z"),
        updatedAt: new Date("2019-10-16T07:45:13.959Z"),
        noTraceability: true,
        wasteDetailsPop: false
      } as Form,
      updatedFields: { noTraceability: "<a value>" },
      mutation: "UPDATED",
      previousNode: {
        id: "xyz12345",
        readableId: "TD-xxx",
        isImportedFromPaper: false,
        status: "RECEIVED",
        createdAt: new Date("2019-10-16T07:45:13.959Z"),
        updatedAt: new Date("2019-10-16T07:45:13.959Z"),
        wasteDetailsPop: false
      } as Form
    };

    const mockedSendMail = jest.spyOn(mailing, "sendMail");

    await formsEventCallback(formPayload);

    expect(mockedSendMail as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const postArgs = mockedSendMail.mock.calls[0];

    const payload = postArgs[0];

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
