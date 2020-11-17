import { AuthType } from "../../../auth";
import { FormUpdateInput } from "@prisma/client";
import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import { formFactory, userFactory } from "../../../__tests__/factories";
import transitionForm from "../transitionForm";
import { EventType } from "../types";

describe("transition form", () => {
  afterAll(resetDatabase);

  it("should update a form with new status and log status change", async () => {
    const owner = await userFactory();
    const user = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "SENT" }
    });
    const formUpdateInput: FormUpdateInput = {
      receivedBy: "Bill",
      receivedAt: "2019-01-17T09:22:00.000Z",
      signedAt: "2019-01-17T09:22:00.000Z",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 1
    };

    const event = { type: EventType.MarkAsReceived, formUpdateInput };
    await transitionForm({ ...user, auth: AuthType.Bearer }, form, event);

    const updatedForm = await prisma.form.findOne({ where: { id: form.id } });

    const nextStatus = "ACCEPTED";

    expect(updatedForm.status).toEqual(nextStatus);

    const statusLogs = await prisma.statusLog.findMany();
    expect(statusLogs).toHaveLength(1);
    const statusLog = statusLogs[0];
    const statusLogUser = await prisma.statusLog
      .findOne({ where: { id: statusLog.id } })
      .user();
    const statusLogForm = await prisma.statusLog
      .findOne({ where: { id: statusLog.id } })
      .form();

    expect(statusLog.status).toEqual(nextStatus);
    expect(statusLog.authType).toEqual("BEARER");
    expect(statusLog.loggedAt).not.toBeNull();
    expect(statusLog.updatedFields).toEqual(formUpdateInput);
    expect(statusLogUser.id).toEqual(user.id);
    expect(statusLogForm.id).toEqual(form.id);
  });

  it("should fail if transition is not possible", async () => {
    const owner = await userFactory();
    const user = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "DRAFT" }
    });
    const formUpdateInput: FormUpdateInput = {
      receivedBy: "Bill",
      receivedAt: "2019-01-17T09:22:00.000Z",
      signedAt: "2019-01-17T09:22:00.000Z",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 1
    };

    // trying to mark a draft form as  received
    const event = { type: EventType.MarkAsReceived, formUpdateInput };
    const transitionFormFn = () => transitionForm(user, form, event);
    await expect(transitionFormFn()).rejects.toThrow(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });
});
