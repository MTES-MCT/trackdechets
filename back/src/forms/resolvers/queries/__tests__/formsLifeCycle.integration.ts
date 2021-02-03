import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  formFactory,
  statusLogFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  prepareDB,
  prepareRedis,
  storeRedisCompanyInfo
} from "../../../__tests__/helpers";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const FORMS_LIFECYCLE = `query FormsLifeCycle($loggedAfter: String, $loggedBefore: String, $formId: ID, $siret: String){
  formsLifeCycle(loggedAfter: $loggedAfter, loggedBefore: $loggedBefore, formId: $formId, siret: $siret){
    statusLogs {
      id
      status
      updatedFields
      loggedAt
      form {
        id
        readableId
      }
      user {
        id
        email
      }
    }
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
    count
  }
}
`;

describe("Test formsLifeCycle query", () => {
  afterEach(async () => {
    await resetDatabase();
  });
  it("should return statusLog data", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { lorem: "ipsum" }
    });

    const { query } = makeClient(recipient);

    const { data } = (await query(FORMS_LIFECYCLE)) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("SENT");
    expect(statusLogs[0].updatedFields.lorem).toBe("ipsum");
    expect(statusLogs[0].form.id).toBe(form.id);
    expect(statusLogs[0].user.id).toBe(emitter.id);
  });

  it("should return not statusLog objects without null loggedAt", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    // create a statusLog without loggedAt field (as it was before formsLifeCycle feature)
    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { lorem: "ipsum" },
      opt: { loggedAt: null }
    });

    const { query } = makeClient(recipient);

    const { data } = (await query(FORMS_LIFECYCLE)) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(0);
  });

  it("should return statusLog data after a given date", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const today = new Date();
    const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date());
    const todayStr = today.toISOString().substring(0, 10);

    // form was sent yesterday
    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" },
      opt: { loggedAt: yesterday }
    });
    // form was received today
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { consectetur: "adipiscing" }
    });

    const { query } = makeClient(recipient);

    // query forms statuses created after today
    const { data } = (await query(FORMS_LIFECYCLE, {
      variables: { loggedAfter: todayStr }
    })) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("RECEIVED");
  });

  it("should return statusLog data before a given date", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const today = new Date();
    const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date());
    const todayStr = today.toISOString().substring(0, 10);

    // form was sent yesterday
    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" },
      opt: { loggedAt: yesterday }
    });
    // form was received today
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { consectetur: "adipiscing" }
    });

    const { query } = makeClient(recipient);

    // query forms statuses created after today
    const { data } = (await query(FORMS_LIFECYCLE, {
      variables: { loggedBefore: todayStr }
    })) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("SENT");
  });

  it("should return statusLog data filtered by formID", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    const otherForm = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" }
    });

    await statusLogFactory({
      status: "PROCESSED",
      formId: otherForm.id,
      userId: emitter.id,
      updatedFields: { foo: "bar" }
    });

    const { query } = makeClient(recipient);

    // query forms statuses created for a given form
    const { data } = (await query(FORMS_LIFECYCLE, {
      variables: { formId: form.id }
    })) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("RECEIVED");
  });

  it("should return statusLog data filtered by siret", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    // let's create another company, associate it to recipient user, then create a form and its status log
    const otherCompany = await companyFactory();
    await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: recipient.id } },
        role: "MEMBER" as UserRole,
        company: { connect: { siret: otherCompany.siret } }
      }
    });
    const otherForm = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: otherCompany.siret
      }
    });

    await storeRedisCompanyInfo({
      company: otherCompany,
      companyTypes: ["WASTE_PROCESSOR"]
    });
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" }
    });

    await statusLogFactory({
      status: "PROCESSED",
      formId: otherForm.id,
      userId: emitter.id,
      updatedFields: { foo: "bar" }
    });

    const { query } = makeClient(recipient);

    // Now we filter results by siret, so status log from otherCompany should not appear
    const { data } = (await query(FORMS_LIFECYCLE, {
      variables: { siret: recipientCompany.siret }
    })) as any;

    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("RECEIVED");
  });

  it("should not return statusLog data for deleted forms", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { lorem: "ipsum" }
    });

    // mark the form as deleted, related statuslogs should be hidden
    await prisma.form.update({
      where: { id: form.id },
      data: {
        isDeleted: true
      }
    });

    const { query } = makeClient(recipient);

    const { data } = (await query(FORMS_LIFECYCLE)) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(0);
  });

  it("should return statusLog data for which the current user is a trader on", async () => {
    const {
      user: trader,
      company: tradingCompany
    } = await userWithCompanyFactory("MEMBER");
    const owner = await userFactory();

    const form = await formFactory({
      ownerId: owner.id,
      opt: { traderCompanySiret: tradingCompany.siret }
    });

    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: owner.id,
      updatedFields: { lorem: "ipsum" }
    });

    const { query } = makeClient(trader);

    const { data } = await query<{ data }>(FORMS_LIFECYCLE);
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("SENT");
    expect(statusLogs[0].updatedFields.lorem).toBe("ipsum");
    expect(statusLogs[0].form.id).toBe(form.id);
    expect(statusLogs[0].user.id).toBe(owner.id);
  });
});
