import { resetDatabase } from "../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { bsdaFactory } from "../../__tests__/factories";
import { prismaToZodBsda } from "../helpers";
import { checkSealedFields } from "../rules";
import { ZodBsda } from "../schema";

describe("checkSealedFields", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when bsda status is INITIAL", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "INITIAL"
      }
    });

    const update: ZodBsda = {
      wasteCode: "10 13 09*"
    };

    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: emitter.user
      }
    );

    expect(updatedFields).toEqual(["wasteCode"]);
  });

  it("should be possible to update worker when bsda status is SIGNED_BY_PRODUCER", async () => {
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: workerCompany } = await userWithCompanyFactory();
    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: destination.siret,
        status: "SIGNED_BY_PRODUCER"
      }
    });

    const update = {
      workerCompanyName: "ACME 2",
      workerCompanySiret: workerCompany.siret
    };

    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user
      }
    );

    expect(updatedFields).toEqual(["workerCompanyName", "workerCompanySiret"]);
  });
  it("should not be possible to update a field sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });
    const update = { emitterCompanyName: "ACME" };

    await expect(() =>
      checkSealedFields(prismaToZodBsda(bsda), update, {
        user: destination.user
      })
    ).rejects.toThrow(
      "Le nom de l'entreprise émettrice a été vérouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to set a sealed field to null if it was empty", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: "",
        destinationCompanySiret: destination.company.siret
      }
    });

    const update = { emitterPickupSiteAddress: null };

    const updatedField = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: destination.user
      }
    );

    expect(updatedField).toEqual([]);
  });

  it("should be possible to set a sealed field to an empty string if it was null", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: null,
        destinationCompanySiret: destination.company.siret
      }
    });

    const update = { emitterPickupSiteAddress: "" };

    const updatedField = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: destination.user
      }
    );

    expect(updatedField).toEqual([]);
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

    const update = { emitterCompanyPhone: "02 05 68 45 98" };

    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user
      }
    );

    expect(updatedFields).toEqual(["emitterCompanyPhone"]);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const grouping = [await bsdaFactory({})];
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        grouping: { connect: grouping.map(bsda => ({ id: bsda.id })) },
        destinationCompanySiret: destination.company.siret
      }
    });

    const update = {
      grouping: grouping.map(bsda => bsda.id),
      emitterCompanyName: bsda.emitterCompanyName
    };

    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: destination.user
      }
    );

    expect(updatedFields).toEqual([]);
  });
  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });

    const update = {
      transporterTransportPlates: ["AD-008-TS"]
    };
    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: destination.user
      }
    );
    expect(updatedFields).toEqual(["transporterTransportPlates"]);
  });
  it("should not be possible to update a field sealed by worker signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });

    const update: ZodBsda = {
      workerWorkHasEmitterPaperSignature:
        !bsda.workerWorkHasEmitterPaperSignature
    };

    await expect(() =>
      checkSealedFields(prismaToZodBsda(bsda), update, { user: emitter.user })
    ).rejects.toThrow(
      "Le champ workerWorkHasEmitterPaperSignature a été vérouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to update a field not yet sealed by worker signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: null
      }
    });
    const update = { transporterTransportPlates: ["AD-008-TS"] };
    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: emitter.user
      }
    );
    expect(updatedFields).toEqual(["transporterTransportPlates"]);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
      }
    });

    const update = { transporterTransportPlates: ["AD-008-TS"] };
    await expect(() =>
      checkSealedFields(prismaToZodBsda(bsda), update, { user: emitter.user })
    ).rejects.toThrow(
      "L'immatriculation du transporteur a été vérouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });

    const zodBsda = prismaToZodBsda(bsda);

    const update = {
      transporterCompanySiret: zodBsda.transporterCompanySiret
    };
    const updatedFields = await checkSealedFields(zodBsda, update, {
      user: emitter.user
    });

    expect(updatedFields).toEqual([]);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const update = { destinationReceptionWeight: 300 };
    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: emitter.user
      }
    );

    expect(updatedFields).toEqual(["destinationReceptionWeight"]);
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });

    const update = { destinationReceptionWeight: 300 };
    await expect(() =>
      checkSealedFields(prismaToZodBsda(bsda), update, { user: emitter.user })
    ).rejects.toThrow(
      "Le poids du déchet a été vérouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to update the destination contact & mail fields when the bsda status is signed by the emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });
    const update = {
      destinationCompanyContact: "New John",
      destinationCompanyPhone: "0101010199",
      destinationCompanyMail: "new@mail.com"
    };
    const updatedFields = await checkSealedFields(
      prismaToZodBsda(bsda),
      update,
      {
        user: destination.user
      }
    );
    expect(updatedFields).toEqual([
      "destinationCompanyContact",
      "destinationCompanyPhone",
      "destinationCompanyMail"
    ]);
  });
});
