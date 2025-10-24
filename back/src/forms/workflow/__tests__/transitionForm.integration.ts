import { Prisma, Status } from "@td/prisma";
import { resetDatabase } from "../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../__tests__/factories";
import transitionForm from "../transitionForm";
import { EventType } from "../types";

describe("transition form", () => {
  afterAll(resetDatabase);

  it("should get the new status", async () => {
    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "SENT" }
    });
    const formUpdateInput: Prisma.FormUpdateInput = {
      receivedBy: "Bill",
      receivedAt: "2019-01-17T09:22:00.000Z",
      signedAt: "2019-01-17T09:22:00.000Z",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 1
    };

    const event = { type: EventType.MarkAsReceived, formUpdateInput };
    const newStatus = transitionForm(form, event);

    const nextStatus = "ACCEPTED" as Status;

    expect(newStatus).toEqual(nextStatus);
  });

  it("should fail if transition is not possible", async () => {
    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "DRAFT" }
    });
    const formUpdateInput: Prisma.FormUpdateInput = {
      receivedBy: "Bill",
      receivedAt: "2019-01-17T09:22:00.000Z",
      signedAt: "2019-01-17T09:22:00.000Z",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 1
    };

    // trying to mark a draft form as  received
    const event = { type: EventType.MarkAsReceived, formUpdateInput };
    await expect(() => transitionForm(form, event)).toThrow(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });
});
