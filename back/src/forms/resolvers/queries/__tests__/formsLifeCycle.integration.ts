import * as mailsHelper from "../../../../common/mails.helper";
import makeClient from "../../../../__tests__/testClient";
import {
  prepareRedis,
  prepareDB,
  storeRedisCompanyInfo
} from "../../../__tests__/helpers";
import {
  statusLogFactory,
  formFactory,
  companyFactory
} from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma, UserRole } from "../../../../generated/prisma-client";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const buildFormsLifecycleQuery = (
  paramKey?: string,
  paramValue?: any
): string => {
  const param = paramKey ? `(${paramKey}: "${paramValue}")` : "";

  return `query{
    formsLifeCycle ${param}{
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
};
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
    const glQuery = buildFormsLifecycleQuery();

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
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
    const glQuery = buildFormsLifecycleQuery();

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
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
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    // form was sent yesterday
    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" },
      opt: { loggedAt: yesterdayStr }
    });
    // form was received today
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { consectetur: "adipiscing" }
    });

    // query forms statuses created after today
    const glQuery = buildFormsLifecycleQuery("loggedAfter", todayStr);

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
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
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    // form was sent yesterday
    await statusLogFactory({
      status: "SENT",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { dolor: "sit amet" },
      opt: { loggedAt: yesterdayStr }
    });
    // form was received today
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { consectetur: "adipiscing" }
    });

    // query forms statuses created after today
    const glQuery = buildFormsLifecycleQuery("loggedBefore", todayStr);

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
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
    // query forms statuses created for a given form
    const glQuery = buildFormsLifecycleQuery("formId", form.id);

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
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
    await prisma.createCompanyAssociation({
      user: { connect: { id: recipient.id } },
      role: "MEMBER" as UserRole,
      company: { connect: { siret: otherCompany.siret } }
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

    // Now we filter results by siret, so status log from otherCompany should not appear

    const glQuery = buildFormsLifecycleQuery("siret", recipientCompany.siret);

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;

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
    await prisma.updateForm({
      where: { id: form.id },
      data: {
        isDeleted: true
      }
    });
    const glQuery = buildFormsLifecycleQuery();

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(0);
  });

  it("should return statusLog data for which the current user is a trader on", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany
    } = await prepareDB();

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const traderForm = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        traderCompanySiret: recipientCompany.siret
      }
    });

    await statusLogFactory({
      status: "SENT",
      formId: traderForm.id,
      userId: emitter.id,
      updatedFields: { lorem: "ipsum" }
    });
    const glQuery = buildFormsLifecycleQuery();

    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
    const { statusLogs } = data.formsLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("SENT");
    expect(statusLogs[0].updatedFields.lorem).toBe("ipsum");
    expect(statusLogs[0].form.id).toBe(traderForm.id);
    expect(statusLogs[0].user.id).toBe(emitter.id);
  });
});
