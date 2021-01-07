import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const MARK_AS_SENT = `
  mutation MarkAsSent($id: ID!, $sentInfo: SentFormInput!){
    markAsSent(id: $id, sentInfo: $sentInfo){
      id
      status
    }
  }
`;

describe("{ mutation { markAsSent } }", () => {
  afterAll(() => resetDatabase());

  it("should fail when SENT is not a possible next step", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT", // cannot transition from SENT to SENT
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the emitter of the BSD can send it when it's sealed", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    form = await prisma.form.findUnique({ where: { id: form.id } });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);

    // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
    expect(form.currentTransporterSiret).toEqual(form.transporterCompanySiret);
  });

  test("the recipient of the BSD can send it when it's sealed", async () => {
    const { user, company: recipientCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form.findUnique({ where: { id: form.id } });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the emitter of the BSD can send it when it's a draft", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    form = await prisma.form.findUnique({ where: { id: form.id } });

    expect(form.status).toEqual("SENT");

    // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
    expect(form.currentTransporterSiret).toEqual(form.transporterCompanySiret);

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the recipient of the BSD can send it when it's a draft", async () => {
    const { user, company: recipientCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    form = await prisma.form.findUnique({ where: { id: form.id } });

    expect(form.status).toEqual("SENT");

    // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
    expect(form.currentTransporterSiret).toEqual(form.transporterCompanySiret);

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("should fail if user is neither emitter or recipient", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: emitterCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });
    expect(errors[0].extensions.code).toBe("FORBIDDEN");

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toEqual("SEALED");

    expect(resultingForm.currentTransporterSiret).toBeNull();
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

      const { errors } = await mutate(MARK_AS_SENT, {
        variables: {
          id: form.id,
          sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
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

  test.each(["20201211", "junk", "2020-12-33"])(
    "sentAt must be a valid date, %p is not valid",
    async dateStr => {
      const { user, company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const recipientCompany = await companyFactory();

      let form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate(MARK_AS_SENT, {
        variables: {
          id: form.id,
          sentInfo: { sentAt: new Date(dateStr), sentBy: "John Doe" }
        }
      });
      expect(errors[0].message).toEqual(
        "La date d'envoi n'est pas formatée correctement"
      );
      form = await prisma.form.findUnique({ where: { id: form.id } });

      expect(form.status).toEqual("SEALED");

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

  test("appendix2Forms should be marked as GROUPED", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP" }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    const appendix2grouped = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("GROUPED");
  });

  test("appendix2Forms already GROUPED should be untouched", async () => {
    // appendix2 forms could have been grouped in markAsSealed

    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: "GROUPED" }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SENT, {
      variables: {
        id: form.id,
        sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe" }
      }
    });

    const appendix2grouped = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("GROUPED");
  });
});
