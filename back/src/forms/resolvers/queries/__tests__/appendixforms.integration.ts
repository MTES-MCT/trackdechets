import * as mailsHelper from "../../../../mailer/mailing";
import makeClient from "../../../../__tests__/testClient";
import {
  formFactory,
  userWithCompanyFactory,
  formWithTempStorageFactory
} from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { gql } from "apollo-server-core";

const APPENDIX_FORMS = gql`
  query AppendixForm($siret: String!) {
    appendixForms(siret: $siret) {
      id
    }
  }
`;

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("Test appendixForms", () => {
  afterEach(async () => {
    await resetDatabase();
  });
  it("should return appendixForms data", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory("ADMIN");
    const { user: recipient, company: recipientCompany } =
      await userWithCompanyFactory("ADMIN");

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
    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "AWAITING_GROUP",
        appendix2RootForm: { connect: { id: form.id } } // Dummy link between forms
      }
    });

    const { query } = makeClient(recipient);
    const {
      data: { appendixForms }
    } = await query<{ appendixForms: { id: string }[] }>(APPENDIX_FORMS, {
      variables: { siret: recipientCompany.siret }
    });

    expect(appendixForms.length).toBe(1);
    expect(appendixForms[0].id).toBe(form.id);
  });

  it("should not return appendixForms data", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory("ADMIN");

    const { user: recipient, company: recipientCompany } =
      await userWithCompanyFactory("ADMIN");

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
    const { data, errors } = await query<{ appendixForms: { id: string }[] }>(
      APPENDIX_FORMS,
      {
        variables: { siret: emitterCompany.siret }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.FORBIDDEN);
    expect(data).toBe(null);
  });

  it("should return appendix 2 candidates for final destination after temp storage", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory("ADMIN");
    const { company: ttrCompany } = await userWithCompanyFactory("ADMIN");
    const { user: destination, company: destinationCompany } =
      await userWithCompanyFactory("ADMIN");

    const form = await formWithTempStorageFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        recipientIsTempStorage: true,
        status: "AWAITING_GROUP"
      },
      tempStorageOpts: { destinationCompanySiret: destinationCompany.siret }
    });
    const { query } = makeClient(destination);
    const {
      data: { appendixForms }
    } = await query<{ appendixForms: { id: string }[] }>(APPENDIX_FORMS, {
      variables: { siret: destinationCompany.siret }
    });

    expect(appendixForms.length).toBe(1);
    expect(appendixForms[0].id).toBe(form.id);
  });
});
