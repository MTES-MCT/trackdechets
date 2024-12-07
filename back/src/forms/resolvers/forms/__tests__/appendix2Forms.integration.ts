import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "@td/codegen-back";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const FORM = gql`
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
      appendix2Forms {
        id
        readableId
        wasteDetails {
          code
        }
        emitter {
          company {
            name
          }
        }
        signedAt
        quantityReceived
        processingOperationDone
        emitterPostalCode
      }
    }
  }
`;

describe("appendix2Forms resolver", () => {
  afterAll(resetDatabase);

  it("should return an empty array when no appendix2 is appended", async () => {
    const { user, company: emitter } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: emitter.siret, emitterType: "APPENDIX2" }
    });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: form.id }
    });
    expect(data.form.appendix2Forms).toEqual([]);
  });

  it("should return appendix2 forms", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const { user: collector, company: collectorCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const appendix2 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        recipientCompanySiret: collectorCompany.siret,
        quantityReceived: 1
      }
    });

    const regroupementForm = await formFactory({
      ownerId: collector.id,
      opt: {
        emitterCompanySiret: collectorCompany.siret,
        emitterType: "APPENDIX2",
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!.toNumber()
          }
        }
      }
    });

    const { query } = makeClient(collector);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: regroupementForm.id }
    });
    expect(data.form.appendix2Forms).toEqual([
      {
        id: appendix2.id,
        readableId: appendix2.readableId,
        wasteDetails: {
          code: appendix2.wasteDetailsCode
        },
        emitter: {
          company: {
            name: appendix2.emitterCompanyName
          }
        },
        signedAt: appendix2.signedAt,
        quantityReceived: appendix2.quantityReceived?.toNumber(),
        processingOperationDone: appendix2.processingOperationDone,
        emitterPostalCode: "13001"
      }
    ]);
  });

  it("should use pickup site postal code when available", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const { user: collector, company: collectorCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const appendix2 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        emitterWorkSiteName: "Adresse de collecte",
        emitterWorkSiteAddress: "Rue du chantier",
        emitterWorkSiteCity: "Annonay",
        emitterWorkSitePostalCode: "07100",
        recipientCompanySiret: collectorCompany.siret,
        quantityReceived: 1
      }
    });
    const regroupementForm = await formFactory({
      ownerId: collector.id,
      opt: {
        emitterCompanySiret: collectorCompany.siret,
        emitterType: "APPENDIX2",
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!.toNumber()
          }
        }
      }
    });

    const { query } = makeClient(collector);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: regroupementForm.id }
    });
    expect(data.form.appendix2Forms).toEqual([
      expect.objectContaining({
        emitterPostalCode: "07100"
      })
    ]);
  });
});
