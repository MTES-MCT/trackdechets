import * as mailsHelper from "../../common/mails.helper";

import makeClient from "../../__tests__/testClient";
import { prepareRedis, prepareDB } from "./helpers";

import { statusLogFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("Test formLifeCycle query", () => {
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
    const glQuery = `
    query {
        formLifeCycle {
          statusLogs {
            id
            status
            updatedFields
            created
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
    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
    const { statusLogs } = data.formLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("SENT");
    expect(statusLogs[0].updatedFields.lorem).toBe("ipsum");
    expect(statusLogs[0].form.id).toBe(form.id);
    expect(statusLogs[0].user.id).toBe(emitter.id);
  });

  it("should return filtered statusLog data", async () => {
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
      opt: { created: yesterday }
    });
    // form was received today
    await statusLogFactory({
      status: "RECEIVED",
      formId: form.id,
      userId: emitter.id,
      updatedFields: { consectetur: "adipiscing" }
    });

    // query forms created after today
    const glQuery = `
    query {
        formLifeCycle (createdAfter: "${todayStr}"){
          statusLogs {
            id
            status
            updatedFields
            created
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
    const { query } = makeClient(recipient);

    const { data } = (await query(glQuery)) as any;
    const { statusLogs } = data.formLifeCycle;
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].status).toBe("RECEIVED");
  });
});
