import * as mailsHelper from "../../common/mails.helper";

import makeClient from "../../__tests__/testClient";
import { prepareDB } from "./helpers";

import { formFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";

const buildQuery = siret => `query{ appendixForms (siret: "${siret}") { id}} `;
// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("Test appendixForms", () => {
  afterEach(async () => {
    await resetDatabase();
  });
  it("should return appendixForms data", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany
    } = await prepareDB();

    // This form is in AWAITING_GROUP and should be returned
    const form = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "AWAITING_GROUP"
      }
    });
    // other forms should not be returned
    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "PROCESSED"
      }
    });
    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED"
      }
    });

    const { query } = makeClient(recipient);
    const {
      data: { appendixForms }
    } = (await query(buildQuery(recipientCompany.siret))) as any;

    expect(appendixForms.length).toBe(1);
    expect(appendixForms[0].id).toBe(form.id);
  });

  it("should not return appendixForms data", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany
    } = await prepareDB();

    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "AWAITING_GROUP"
      }
    });
    // the queried siret is not recipientCompanySiret, result should be null

    const { query } = makeClient(recipient);
    const {
      data: { appendixForms }
    } = (await query(buildQuery(emitterCompany.siret))) as any;

    expect(appendixForms).toBe(null);
  });
});
