import { CompanyType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  companyFactory,
  destinationFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

const MARK_AS_SEALED = `
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      id
      status
    }
  }
`;

describe("Mutation.markAsSealed", () => {
  afterAll(() => resetDatabase());

  it("should fail if SEALED is not a possible next state", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  it.each(["emitter", "recipient", "trader", "transporter"])(
    "%p of the BSD can seal it",
    async role => {
      const companyType = (role: string) =>
        ({
          emitter: CompanyType.PRODUCER,
          recipient: CompanyType.WASTEPROCESSOR,
          trader: CompanyType.TRADER,
          transporter: CompanyType.TRANSPORTER
        }[role]);

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: { set: [companyType(role)] }
      });

      let form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          [`${role}CompanySiret`]: company.siret,
          ...(role !== "recipient"
            ? { recipientCompanySiret: (await destinationFactory()).siret }
            : {})
        }
      });

      const { mutate } = makeClient(user);
      await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });

      form = await prisma.form.findUnique({ where: { id: form.id } });

      expect(form.status).toEqual("SEALED");

      // check relevant statusLog is created
      const statusLogs = await prisma.statusLog.findMany({
        where: {
          form: { id: form.id },
          user: { id: user.id },
          status: "SEALED"
        }
      });
      expect(statusLogs.length).toEqual(1);
    }
  );

  it("the eco-organisme of the BSD can seal it", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();
    const traderCompany = await companyFactory({
      companyTypes: {
        set: [CompanyType.TRADER]
      }
    });

    const { user, company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const eo = await prisma.ecoOrganisme.create({
      data: {
        name: "An EO",
        siret: ecoOrganismeCompany.siret,
        address: "An address"
      }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "OTHER",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        traderCompanySiret: traderCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    form = await prisma.form.findUnique({ where: { id: form.id } });

    expect(form.status).toEqual("SEALED");
  });

  it("should fail if bsd has an eco-organisme and the wrong emitterType", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();
    const { user, company: eo } = await userWithCompanyFactory("MEMBER");
    await prisma.ecoOrganisme.create({
      data: {
        name: eo.name,
        siret: eo.siret,
        address: "An address"
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "PRODUCER",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): Émetteur: Le type d'émetteur doit être "OTHER" lorsqu'un éco-organisme est responsable du déchet`
        ].join("\n")
      })
    ]);
  });

  it("should fail if user is not authorized", async () => {
    const owner = await userFactory();
    const { user } = await userWithCompanyFactory("MEMBER");

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: emitterCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });
    expect(errors[0].extensions.code).toBe("FORBIDDEN");

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toEqual("DRAFT");
  });

  it("the BSD can not be sealed if data do not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: "", // this field is required and will make the mutation fail
        emitterCompanyContact: "", // this field is required and will make the mutation fail
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    // check error message is relevant and only failing fields are reported
    const errMessage =
      "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
      "Erreur(s): Émetteur: Le siret de l'entreprise est obligatoire\n" +
      "Émetteur: Le contact dans l'entreprise est obligatoire";
    expect(errors[0].message).toBe(errMessage);

    form = await prisma.form.findUnique({ where: { id: form.id } });
    expect(form.status).toEqual("DRAFT");

    // no statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id } }
    });
    expect(statusLogs.length).toEqual(0);
  });

  it.each(["toto", "lorem ipsum", "01 02 03", "101309*"])(
    "wrong waste code (%p) must invalidate mutation",
    async wrongWasteCode => {
      const { user, company: recipientCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
        }
      );

      const emitterCompany = await companyFactory();

      let form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: wrongWasteCode
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });

      expect(errors[0].message).toEqual(
        expect.stringContaining(
          "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement."
        )
      );
      form = await prisma.form.findUnique({ where: { id: form.id } });

      expect(form.status).toEqual("DRAFT");

      // check no SEALED statusLog is created
      const statusLogs = await prisma.statusLog.findMany({
        where: {
          form: { id: form.id },
          user: { id: user.id },
          status: "SEALED"
        }
      });
      expect(statusLogs.length).toEqual(0);
    }
  );

  it("should be required to provide onuCode for dangerous wastes", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "05 01 04*",
        wasteDetailsOnuCode: null
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
        ].join("\n")
      })
    ]);
  });

  it("should be optional to provide onuCode for non-dangerous wastes", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "01 01 01",
        wasteDetailsOnuCode: null
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(data.markAsSealed.status).toBe("SEALED");
  });

  it("should mark appendix2 forms as grouped", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP" }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    const appendix2grouped = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("GROUPED");
  });

  it("should throw an error if destination is not registered in TD", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: "11111111111111"
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "L'installation de destination ou d’entreposage ou de reconditionnement prévue (cadre 2) n'est pas inscrite sur Trackdéchets"
      })
    ]);
  });

  it("should throw an error if destination after temporary storage is not registered in TD", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: "11111111111111"
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "L'installation de destination ou d’entreposage ou de reconditionnement prévue (cadre 2) n'est pas inscrite sur Trackdéchets"
      })
    ]);
  });

  it("should throw an error if destination is not registered as waste processor or TTR", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const destination = await companyFactory({
      // assume profile is not COLLECTOR or WASTEPROCESSOR
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: destination.siret
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'installation de destination ou d’entreposage ou de reconditionnement prévue ${destination.siret}
      n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 2 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
      })
    ]);
  });

  it("should throw an error if destination after temp storage is not registered as waste processor or TTR", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });
    const destination = await companyFactory({
      // assume profile is not COLLECTOR or WASTEPROCESSOR
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: collector.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: {
          update: { destinationCompanySiret: destination.siret }
        }
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'installation de destination prévue après entreposage provisoire ou reconditionnement ${destination.siret}
      n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 14 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'installation depuis l'interface Trackdéchets Mon Compte > Établissements`
      })
    ]);
  });
});
