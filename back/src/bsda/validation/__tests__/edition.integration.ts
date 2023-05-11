import { bsdaFactory } from "../../__tests__/factories";
import prisma from "../../../prisma";
import { checkEditionRules } from "../edition";
import {
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when bsda status is INITIAL", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL"
      }
    });
    const checked = await checkEditionRules(bsda, {
      emitter: { company: { name: "ACME" } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update any fields when bsda status is SIGNED_BY_PRODUCER", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        workerCompanySiret: company.siret,
        destinationCompanySiret: company.siret,
        transporterCompanySiret: company.siret,
        destinationOperationNextDestinationCompanySiret: siretify(2),
        status: "SIGNED_BY_PRODUCER"
      }
    });
    const checked = await checkEditionRules(
      bsda,
      {
        worker: { company: { name: "ACME 2", siret: siretify(1) } }
      },
      user
    );
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsda, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible to set a sealed field to null if it was empty", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: ""
      }
    });

    const checked = await checkEditionRules(bsda, {
      emitter: { pickupSite: { address: null } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to set a sealed field to an empty string if it was null", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: null
      }
    });

    const checked = await checkEditionRules(bsda, {
      emitter: { pickupSite: { address: "" } }
    });
    expect(checked).toBe(true);
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

    const checked = await checkEditionRules(
      bsda,
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
        siret: intermediary.siret!,
        name: intermediary.name,
        contact: "contact"
      }
    });

    const checked = await checkEditionRules(bsda, {
      emitter: { company: { siret: bsda.emitterCompanySiret } },
      forwarding: bsda.forwardingId,
      grouping: grouping.map(bsda => bsda.id),
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

    const checked = await checkEditionRules(bsda, {
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

    const checkFn = () =>
      checkEditionRules(bsda, {
        worker: {
          work: {
            hasEmitterPaperSignature: !bsda.workerWorkHasEmitterPaperSignature
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

    const checked = await checkEditionRules(bsda, {
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

    const checkFn = () =>
      checkEditionRules(bsda, {
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
        siret: intermediary.siret!,
        name: intermediary.name,
        contact: "contact"
      }
    });

    const checked = await checkEditionRules(bsda, {
      transporter: { company: { siret: bsda.transporterCompanySiret } },
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

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const checked = await checkEditionRules(bsda, {
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

    const checkFn = () =>
      checkEditionRules(bsda, {
        destination: { reception: { weight: 300 } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionWeight"
    );
  });
});
