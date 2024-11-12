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
import { prisma } from "@td/prisma";
import { updateAppendix2Fn } from "../../../updateAppendix2";
import { AuthType } from "../../../../auth";

const APPENDIX_FORMS = gql`
  query AppendixForm($siret: String!) {
    appendixForms(siret: $siret) {
      id
      quantityGrouped
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

    await updateAppendix2Fn({
      formId: initialForm1.id,
      user: { ...emitter, auth: AuthType.Bearer }
    });
    await updateAppendix2Fn({
      formId: initialForm2.id,
      user: { ...emitter, auth: AuthType.Bearer }
    });

    const { query } = makeClient(ttr);
    const {
      data: { appendixForms }
    } = await query<{ appendixForms: { id: string }[] }>(APPENDIX_FORMS, {
      variables: { siret: ttrCompany.siret }
    });

    expect(appendixForms.length).toBe(2);

    expect(
      appendixForms.map(bsd => bsd.id).sort((a, b) => a.localeCompare(b))
    ).toEqual(
      [awaitingGroupForm.id, initialForm2.id].sort((a, b) => a.localeCompare(b))
    );
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

  describe("quantityRefused", () => {
    it("should return candidates", async () => {
      // Given
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: ttr, company: ttrCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );

      // This form is in AWAITING_GROUP and should be returned
      const awaitingGroupForm = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 10,
          quantityRefused: 7
        }
      });

      // Totally grouped, should not be returned
      const totallyGrouped = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 12,
          quantityRefused: 5
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
          initialFormId: totallyGrouped.id,
          quantity: 7 // Totally grouped
        }
      });

      // Partially grouped, should be returned
      const partiallyGrouped = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 10,
          quantityRefused: 5
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
          initialFormId: partiallyGrouped.id,
          quantity: 3 // Partially grouped,
        }
      });

      await updateAppendix2Fn({
        formId: totallyGrouped.id,
        user: { ...emitter, auth: AuthType.Bearer }
      });
      await updateAppendix2Fn({
        formId: partiallyGrouped.id,
        user: { ...emitter, auth: AuthType.Bearer }
      });

      const { query } = makeClient(ttr);
      const {
        data: { appendixForms }
      } = await query<{
        appendixForms: { id: string; quantityGrouped: number }[];
      }>(APPENDIX_FORMS, {
        variables: { siret: ttrCompany.siret }
      });

      expect(appendixForms.length).toBe(2);

      expect(
        appendixForms.map(bsd => bsd.id).sort((a, b) => a.localeCompare(b))
      ).toEqual(
        [awaitingGroupForm.id, partiallyGrouped.id].sort((a, b) =>
          a.localeCompare(b)
        )
      );
      expect(appendixForms.map(bsd => bsd.quantityGrouped).sort()).toEqual([
        0, 3
      ]);
    });

    it("new + legacy > should return candidates", async () => {
      // Given
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: ttr, company: ttrCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );

      // This form is in AWAITING_GROUP and should be returned
      const awaitingGroupForm = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 10,
          quantityRefused: 7
        }
      });

      const awaitingGroupForm2 = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 8
        }
      });

      // Totally grouped, should not be returned
      const totallyGrouped = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 12,
          quantityRefused: 5
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
          initialFormId: totallyGrouped.id,
          quantity: 7 // Totally grouped
        }
      });

      // Partially grouped, should be returned
      const partiallyGrouped = await formFactory({
        ownerId: emitter.id,
        opt: {
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: ttrCompany.siret,
          status: "AWAITING_GROUP",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 10
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
          initialFormId: partiallyGrouped.id,
          quantity: 3 // Partially grouped,
        }
      });

      await updateAppendix2Fn({
        formId: totallyGrouped.id,
        user: { ...emitter, auth: AuthType.Bearer }
      });
      await updateAppendix2Fn({
        formId: partiallyGrouped.id,
        user: { ...emitter, auth: AuthType.Bearer }
      });

      const { query } = makeClient(ttr);
      const {
        data: { appendixForms }
      } = await query<{
        appendixForms: { id: string; quantityGrouped: number }[];
      }>(APPENDIX_FORMS, {
        variables: { siret: ttrCompany.siret }
      });

      expect(appendixForms.length).toBe(3);

      expect(
        appendixForms.map(bsd => bsd.id).sort((a, b) => a.localeCompare(b))
      ).toEqual(
        [awaitingGroupForm.id, awaitingGroupForm2.id, partiallyGrouped.id].sort(
          (a, b) => a.localeCompare(b)
        )
      );
      expect(appendixForms.map(bsd => bsd.quantityGrouped).sort()).toEqual([
        0, 0, 3
      ]);
    });
  });
});
