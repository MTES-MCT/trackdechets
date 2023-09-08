import { sendMail } from "../../../../mailer/mailing";
import makeClient from "../../../../__tests__/testClient";
import {
  formFactory,
  userWithCompanyFactory,
  formWithTempStorageFactory
} from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { gql } from "graphql-tag";
import prisma from "../../../../prisma";
import {
  getFormRepository,
  getReadOnlyFormRepository
} from "../../../repository";
import { AuthType } from "../../../../auth";

const APPENDIX_FORMS = gql`
  query AppendixForm($siret: String!) {
    appendixForms(siret: $siret) {
      id
    }
  }
`;

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

describe("Test appendixForms", () => {
  afterEach(async () => {
    await resetDatabase();
  });
  it("should return appendix 2 candidates", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory("ADMIN");
    const { user: ttr, company: ttrCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );

    const { updateAppendix2Forms } = getFormRepository({
      ...ttr,
      auth: AuthType.Session
    });

    // This form is in AWAITING_GROUP and should be returned
    const awaitingGroupForm = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });
    // processed form, should not be returned
    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        status: "PROCESSED",
        quantityReceived: 1
      }
    });
    // received form, should not be returned
    await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        status: "RECEIVED",
        quantityReceived: 1
      }
    });

    // totally grouped, should not be returned
    const initialForm1 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });

    const groupingForm1 = await formFactory({
      ownerId: ttr.id,
      opt: {
        emitterCompanyName: ttrCompany.name,
        emitterCompanySiret: ttrCompany.siret,
        recipientCompanySiret: destinationCompany.siret,
        status: "SEALED"
      }
    });

    await prisma.formGroupement.create({
      data: {
        nextFormId: groupingForm1.id,
        initialFormId: initialForm1.id,
        quantity: 1 // totally grouped
      }
    });

    // partially grouped, should be returned
    const initialForm2 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });

    const groupingForm2 = await formFactory({
      ownerId: ttr.id,
      opt: {
        emitterCompanyName: ttrCompany.name,
        emitterCompanySiret: ttrCompany.siret,
        recipientCompanySiret: destinationCompany.siret,
        status: "SEALED"
      }
    });

    await prisma.formGroupement.create({
      data: {
        nextFormId: groupingForm2.id,
        initialFormId: initialForm2.id,
        quantity: 0.5 // partially grouped,
      }
    });

    await updateAppendix2Forms([initialForm1, initialForm2]);

    const { query } = makeClient(ttr);
    const {
      data: { appendixForms }
    } = await query<{ appendixForms: { id: string }[] }>(APPENDIX_FORMS, {
      variables: { siret: ttrCompany.siret }
    });

    expect(appendixForms.length).toBe(2);
    expect(appendixForms[0].id).toBe(awaitingGroupForm.id);
    expect(appendixForms[1].id).toBe(initialForm2.id);
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.FORBIDDEN);
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
        status: "AWAITING_GROUP",
        quantityReceived: 1
      },
      forwardedInOpts: { recipientCompanySiret: destinationCompany.siret }
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
