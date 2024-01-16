import { prisma } from "@td/prisma";
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
    const updateFields = await checkEditionRules(bsff, {
      emitter: { company: { name: "ACME" } }
    });
    expect(updateFields).toEqual(["emitterCompanyName"]);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const checkFn = () =>
      checkEditionRules(bsff, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const updateFields = await checkEditionRules(
      bsff,
      {
        emitter: { company: { name: "ACME" } }
      },
      emitter.user
    );

    expect(updateFields).toEqual(["emitterCompanyName"]);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const detenteur = await userWithCompanyFactory("MEMBER");
    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: { ficheInterventions: { connect: { id: ficheIntervention.id } } }
    });
    const updateFields = await checkEditionRules(bsff, {
      emitter: { company: { siret: bsff.emitterCompanySiret } },
      packagings: bsff.packagings.map(p => ({
        type: p.type,
        numero: p.numero,
        volume: p.volume,
        weight: p.weight
      })),
      ficheInterventions: [ficheIntervention.id]
    });
    expect(updateFields).toEqual([]);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterEmission({ emitter });
    const updatedFields = await checkEditionRules(bsff, {
      transporter: { transport: { plates: ["AD-008-TS"] } }
    });
    expect(updatedFields).toEqual(["transporterTransportPlates"]);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterTransport({ emitter, transporter });

    const checkFn = () =>
      checkEditionRules(bsff, {
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
    const updatedFields = await checkEditionRules(bsff, {
      transporter: { company: { siret: bsff.transporterCompanySiret } }
    });
    expect(updatedFields).toEqual([]);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterTransport({ emitter, transporter });
    const updatedFields = await checkEditionRules(bsff, {
      destination: { reception: { date: new Date("2021-01-01") } }
    });
    expect(updatedFields).toEqual(["destinationReceptionDate"]);
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

    const checkFn = () =>
      checkEditionRules(bsff, {
        destination: { reception: { date: new Date("2021-01-01") } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionDate"
    );
  });
});
