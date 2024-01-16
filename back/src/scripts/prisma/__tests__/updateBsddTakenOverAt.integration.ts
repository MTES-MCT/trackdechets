import { resetDatabase } from "../../../../integration-tests/helper";
import { getStream } from "../../../activity-events";
import { prisma } from "@td/prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { updateBsddTakenOverAt } from "../updateBsddTakenOverAt";

describe("updateBsddTakenOverAt", () => {
  afterAll(resetDatabase);

  it("should update BSDDs where takenOverAt < emittedAt", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // this form should be updated
    const form1 = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emittedAt: new Date("2023-01-22"),
        takenOverAt: new Date("2023-01-21")
      }
    });

    // this form should not be updated
    const form2 = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emittedAt: new Date("2023-01-21"),
        takenOverAt: new Date("2023-01-22")
      }
    });

    // this form should not be updated
    const form3 = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emittedAt: new Date("2022-12-01"),
        takenOverAt: new Date("2022-11-29")
      }
    });

    const count = await updateBsddTakenOverAt({
      gte: new Date("2023-01-01"),
      lte: new Date("2023-01-25")
    });
    expect(count).toEqual(1);

    const updatedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: form1.id }
    });

    expect(updatedForm1.takenOverAt).toEqual(updatedForm1.emittedAt);

    const updatedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: form2.id }
    });

    expect(updatedForm2.takenOverAt).not.toEqual(updatedForm2.emittedAt);

    const updatedForm3 = await prisma.form.findUniqueOrThrow({
      where: { id: form3.id }
    });

    expect(updatedForm3.takenOverAt).not.toEqual(updatedForm3.emittedAt);

    const events = await getStream(form1.id);

    expect(events).toHaveLength(1);

    expect(events[0]).toEqual(
      expect.objectContaining({ streamId: form1.id, actor: "support-td" })
    );
  });
});
