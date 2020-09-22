import { resetDatabase } from "../../../../integration-tests/helper";
import { FormUpdateInput, prisma } from "../../../generated/prisma-client";
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
      receivedAt: "2019-01-17T10:22:00+0100",
      signedAt: "2019-01-17T10:22:00+0100",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 1
    };

    const event = { type: EventType.MarkAsReceived, formUpdateInput };
    await transitionForm(user, form, event);

    const updatedForm = await prisma.form({ id: form.id });

    const nextStatus = "RECEIVED";

    expect(updatedForm.status).toEqual(nextStatus);

    const statusLogs = await prisma.statusLogs();
    expect(statusLogs).toHaveLength(1);
    const statusLog = statusLogs[0];
    const statusLogUser = await prisma.statusLog({ id: statusLog.id }).user();
    const statusLogForm = await prisma.statusLog({ id: statusLog.id }).form();

    expect(statusLog.status).toEqual(nextStatus);
    expect(statusLog.loggedAt.length).toBeGreaterThan(0);
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
      receivedAt: "2019-01-17T10:22:00+0100",
      signedAt: "2019-01-17T10:22:00+0100",
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
