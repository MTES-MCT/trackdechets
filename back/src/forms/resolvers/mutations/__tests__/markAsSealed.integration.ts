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

describe("{ mutation { markAsSealed } }", () => {
  afterAll(() => resetDatabase());

  test.each(["emitter", "recipient", "trader", "transporter"])(
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

      const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

      await mutate(mutation);

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

  test("the eco-organisme of the BSD can seal it", async () => {
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
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        traderCompanySiret: traderCompany.siret,
        ecoOrganisme: {
          connect: { id: eo.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SEALED");
  });

  test("should fail if user is not authorized", async () => {
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

    const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation);
    expect(errors[0].extensions.code).toBe("FORBIDDEN");

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toEqual("DRAFT");
  });

  test("the BSD can not be sealed if data do not validate", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyContact: "", // this field is required and will make the mutation fail
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation);

    // check error message is relevant and only failing fields are reported
    const errMessage =
      "Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): Émetteur: Le contact dans l'entreprise est obligatoire";
    expect(errors[0].message).toBe(errMessage);

    form = await prisma.form({ id: form.id });
    expect(form.status).toEqual("DRAFT");

    // no statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id } }
    });
    expect(statusLogs.length).toEqual(0);
  });

  test.each(["toto", "", "lorem ipsum", "01 02 03", "101309*"])(
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

      const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

      const { errors } = await mutate(mutation);

      expect(errors[0].message).toEqual(
        expect.stringContaining(
          "Le code déchet est obligatoire et doit appartenir à la liste  du code"
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
        wasteDetailsCode: "05 01 04*",
        wasteDetailsOnuCode: null
      }
    });

    const MARK_AS_SEALED = `
      mutation MarkAsSealed($id: ID!) {
        markAsSealed(id: $id) {
          status
        }
      }
    `;
    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.",
          "Erreur(s): Le code ONU est obligatoire pour les déchets dangereux"
        ].join("\n")
      })
    ]);

    await prisma.updateForm({
      data: {
        wasteDetailsCode: "01 01 01"
      },
      where: {
        id: form.id
      }
    });
    const { data } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });
    expect(data.markAsSealed.status).toBe("SEALED");
  });
});
