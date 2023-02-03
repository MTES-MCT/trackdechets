import { bsdaFactory } from "./factories";
import prisma from "../../prisma";
import { checkEditionRules } from "../edition";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when bsda status is INITIAL", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL"
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });
    const checked = await checkEditionRules(fullBsda, {
      emitter: { company: { name: "ACME" } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checkFn = () =>
      checkEditionRules(fullBsda, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(
      fullBsda,
      {
        emitter: { company: { name: "ACME" } }
      },
      user
    );

    expect(checked).toBe(true);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const grouping = [await bsdaFactory({})];
    const forwarding = await bsdaFactory({});
    const intermediary = await companyFactory();
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        grouping: { connect: grouping.map(bsda => ({ id: bsda.id })) },
        forwarding: { connect: { id: forwarding.id } }
      }
    });
    await prisma.intermediaryBsdaAssociation.create({
      data: {
        bsdaId: bsda.id,
        siret: intermediary.siret,
        name: intermediary.name,
        contact: "contact"
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(fullBsda, {
      emitter: { company: { siret: fullBsda.emitterCompanySiret } },
      forwarding: fullBsda.forwardingId,
      grouping: fullBsda.grouping.map(bsda => bsda.id),
      intermediaries: [
        {
          siret: intermediary.siret,
          name: intermediary.name,
          contact: "contact2"
        }
      ]
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(fullBsda, {
      transporter: { transport: { plates: ["AD-008-TS"] } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by worker signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checkFn = () =>
      checkEditionRules(fullBsda, {
        worker: {
          work: {
            hasEmitterPaperSignature:
              !fullBsda.workerWorkHasEmitterPaperSignature
          }
        }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : workerWorkHasEmitterPaperSignature"
    );
  });

  it("should be possible to update a field not yet sealed by worker signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(fullBsda, {
      transporter: { transport: { plates: ["AD-008-TS"] } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checkFn = () =>
      checkEditionRules(fullBsda, {
        transporter: {
          transport: {
            plates: ["AD-008-YT"]
          }
        }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporterTransportPlates"
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const intermediary = await companyFactory();
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });
    await prisma.intermediaryBsdaAssociation.create({
      data: {
        bsdaId: bsda.id,
        siret: intermediary.siret,
        name: intermediary.name,
        contact: "contact"
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(fullBsda, {
      transporter: { company: { siret: fullBsda.transporterCompanySiret } },
      intermediaries: [
        {
          siret: intermediary.siret,
          name: intermediary.name,
          contact: "contact2"
        }
      ]
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checkFn = () =>
      checkEditionRules(fullBsda, {
        transporter: {
          transport: {
            plates: ["AD-008-YT"]
          }
        }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporterTransportPlates"
    );
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checked = await checkEditionRules(fullBsda, {
      destination: { reception: { weight: 300 } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });
    const fullBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id },
      include: { grouping: true, forwarding: true, intermediaries: true }
    });

    const checkFn = () =>
      checkEditionRules(fullBsda, {
        destination: { reception: { weight: 300 } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionWeight"
    );
  });
});
