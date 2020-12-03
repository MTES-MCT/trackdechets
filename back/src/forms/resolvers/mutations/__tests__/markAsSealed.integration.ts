import {
  userWithCompanyFactory,
  formFactory,
  companyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";

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

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: company.siret
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
      const { user, company } = await userWithCompanyFactory("MEMBER");

      let form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          [`${role}CompanySiret`]: company.siret
        }
      });

      const { mutate } = makeClient(user);
      await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });

      form = await prisma.form({ id: form.id });

      expect(form.status).toEqual("SEALED");

      // check relevant statusLog is created
      const statusLogs = await prisma.statusLogs({
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
    const recipientCompany = await companyFactory();
    const traderCompany = await companyFactory();

    const { user, company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const eo = await prisma.createEcoOrganisme({
      name: "An EO",
      siret: ecoOrganismeCompany.siret,
      address: "An address"
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

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SEALED");
  });

  it("should fail if bsd has an eco-organisme and the wrong emitterType", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await companyFactory();
    const { user, company: eo } = await userWithCompanyFactory("MEMBER");
    await prisma.createEcoOrganisme({
      name: eo.name,
      siret: eo.siret,
      address: "An address"
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

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toEqual("DRAFT");
  });

  it("the BSD can not be sealed if data do not validate", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: "", // this field is required and will make the mutation fail
        emitterCompanyContact: "", // this field is required and will make the mutation fail
        recipientCompanySiret: recipientCompany.siret
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
      "Émetteur: Le SIRET doit faire 14 caractères numériques\n" +
      "Émetteur: Le contact dans l'entreprise est obligatoire";
    expect(errors[0].message).toBe(errMessage);

    form = await prisma.form({ id: form.id });
    expect(form.status).toEqual("DRAFT");

    // no statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id } }
    });
    expect(statusLogs.length).toEqual(0);
  });

  it.each(["toto", "", "lorem ipsum", "01 02 03", "101309*"])(
    "wrong waste code (%p) must invalidate mutation",
    async wrongWasteCode => {
      const { user, company: recipientCompany } = await userWithCompanyFactory(
        "MEMBER"
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
      form = await prisma.form({ id: form.id });

      expect(form.status).toEqual("DRAFT");

      // check no SEALED statusLog is created
      const statusLogs = await prisma.statusLogs({
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
    const recipientCompany = await companyFactory();
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
    const recipientCompany = await companyFactory();
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
    const user = await userFactory();
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP" }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: "DRAFT" }
    });
    await prisma.updateForm({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    const appendix2grouped = await prisma.form({ id: appendix2.id });
    expect(appendix2grouped.status).toEqual("GROUPED");
  });
});
