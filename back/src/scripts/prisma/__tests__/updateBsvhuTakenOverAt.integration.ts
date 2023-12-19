import { resetDatabase } from "../../../../integration-tests/helper";
import { getStream } from "../../../activity-events";
import { bsvhuFactory } from "../../../bsvhu/__tests__/factories.vhu";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { updateBsvhuTakenOverAt } from "../updateBsvhuTakenOverAt";

describe("updateBsvhuTakenOverAt", () => {
  afterAll(resetDatabase);

  it("should update BSVHUs where transporterTransportTakenOverAt < emitterEmissionSignatureDate", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    // this bsvhu should be updated
    const bsvhu1 = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date("2023-01-22"),
        transporterTransportTakenOverAt: new Date("2023-01-21")
      }
    });

    // this bsvhu should not be updated
    const bsvhu2 = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date("2023-01-21"),
        transporterTransportTakenOverAt: new Date("2023-01-22")
      }
    });

    // this form should not be updated
    const bsvhu3 = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date("2022-12-01"),
        transporterTransportTakenOverAt: new Date("2022-11-29")
      }
    });

    const count = await updateBsvhuTakenOverAt({
      gte: new Date("2023-01-01"),
      lte: new Date("2023-01-25")
    });
    expect(count).toEqual(1);

    const updatedBsvhu1 = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu1.id }
    });

    expect(updatedBsvhu1.transporterTransportTakenOverAt).toEqual(
      updatedBsvhu1.emitterEmissionSignatureDate
    );

    const updatedBsvhu2 = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu2.id }
    });

    expect(updatedBsvhu2.transporterTransportTakenOverAt).not.toEqual(
      updatedBsvhu2.emitterEmissionSignatureDate
    );

    const updatedBsvhu3 = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu3.id }
    });

    expect(updatedBsvhu3.transporterTransportTakenOverAt).not.toEqual(
      updatedBsvhu3.emitterEmissionSignatureDate
    );

    const events = await getStream(bsvhu1.id);

    expect(events).toHaveLength(1);

    expect(events[0]).toEqual(
      expect.objectContaining({ streamId: bsvhu1.id, actor: "support-td" })
    );
  });
});
