import prisma from "../../../prisma";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterReception,
  createBsffAfterTransport,
  createFicheIntervention
} from "../../__tests__/factories";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { checkEditionRules } from "../bsffEdition";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when BSFF status is INITIAL", async () => {
    const bsff = await createBsff({}, { status: "INITIAL" });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });
    const checked = await checkEditionRules(fullBsff, {
      emitter: { company: { name: "ACME" } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });

    const checkFn = () =>
      checkEditionRules(fullBsff, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });

    const checked = await checkEditionRules(
      fullBsff,
      {
        emitter: { company: { name: "ACME" } }
      },
      emitter.user
    );

    expect(checked).toBe(true);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });
    const detenteur = await userWithCompanyFactory("MEMBER");
    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: { ficheInterventions: { connect: { id: ficheIntervention.id } } }
    });
    const checked = await checkEditionRules(fullBsff, {
      emitter: { company: { siret: fullBsff.emitterCompanySiret } },
      packagings: bsff.packagings.map(p => ({
        type: p.type,
        numero: p.numero,
        volume: p.volume,
        weight: p.weight
      })),
      ficheInterventions: [ficheIntervention.id]
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });

    const checked = await checkEditionRules(fullBsff, {
      transporter: { transport: { plates: ["AD-008-TS"] } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterTransport({ emitter, transporter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });

    const checkFn = () =>
      checkEditionRules(fullBsff, {
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
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterTransport({ emitter, transporter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });
    const checked = await checkEditionRules(fullBsff, {
      transporter: { company: { siret: fullBsff.transporterCompanySiret } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterTransport({ emitter, transporter });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });
    const checked = await checkEditionRules(fullBsff, {
      destination: { reception: { date: new Date("2021-01-01") } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by reception signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });
    const fullBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: {
        grouping: true,
        forwarding: true,
        repackaging: true,
        packagings: true
      }
    });

    const checkFn = () =>
      checkEditionRules(fullBsff, {
        destination: { reception: { date: new Date("2021-01-01") } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionDate"
    );
  });
});
