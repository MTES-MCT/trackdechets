import type { Mutation } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import gql from "graphql-tag";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { randomUUID } from "node:crypto";
import { prisma } from "@td/prisma";
import { subMonths, format, addDays } from "date-fns";

const ADD_TO_SSD_REGISTRY = gql`
  mutation AddToSsdRegistry($lines: [SsdLineInput!]!) {
    addToSsdRegistry(lines: $lines) {
      stats {
        errors
        insertions
        edits
        cancellations
        skipped
      }
      errors {
        publicId
        message
      }
      inserted {
        publicId
      }
      edited {
        publicId
      }
      skipped {
        publicId
      }
      cancelled {
        publicId
      }
    }
  }
`;

function getCorrectLine(siret: string) {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const processingDate = format(sixMonthsAgo, "yyyy-MM-dd");
  const useDate = format(addDays(sixMonthsAgo, 1), "yyyy-MM-dd");
  return {
    reason: undefined,
    publicId: randomUUID(),
    reportAsCompanySiret: undefined,
    reportForCompanySiret: siret,
    useDate,
    dispatchDate: undefined,
    wasteCode: "06 07 01*",
    wasteDescription: "Description déchet",
    wasteCodeBale: "A1100",
    secondaryWasteCodes: undefined,
    secondaryWasteDescriptions: undefined,
    product: "Produit",
    weightValue: 1.4,
    weightIsEstimate: false,
    volume: 1.2,
    processingDate,
    processingEndDate: undefined,
    destinationCompanyType: "ETABLISSEMENT_FR",
    destinationCompanyOrgId: "78467169500103",
    destinationCompanyName: "Nom destination",
    destinationCompanyAddress: "Adresse destination",
    destinationCompanyCity: "Ville destination",
    destinationCompanyPostalCode: "75001",
    destinationCompanyCountryCode: "FR",
    operationCode: "R 5",
    operationMode: "RECYCLAGE",
    administrativeActReference: "Arrêté du 24 août 2016"
  };
}

describe("Registry - addToSsdRegistry", () => {
  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines: [] } }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous n'êtes pas connecté."
      })
    );
  });

  it("should not be able to import more than 1_000 lines at once", async () => {
    const { user } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 1_001 }, (_, i) =>
      getCorrectLine(`0000000000000${i}`)
    );
    const { errors } = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines } }
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous ne pouvez pas importer plus de 1000 lignes par appel"
      })
    );
  });

  it("should create an ssd item", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.siret!)];

    const { data } = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToSsdRegistry.stats.insertions).toBe(1);
  });

  it("should create several ssd items", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToSsdRegistry.stats.insertions).toBe(100);
  });

  it("should create and edit an ssd item in one go", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.siret!);
    const editedLine = { ...line, reason: "EDIT", wasteCodeBale: "A1070" };
    const lines = [line, editedLine];

    const { data } = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToSsdRegistry.stats.insertions).toBe(1);
    expect(data.addToSsdRegistry.stats.edits).toBe(1);

    const result = await prisma.registrySsd.findFirstOrThrow({
      where: { publicId: line.publicId, isLatest: true }
    });
    expect(result.wasteCodeBale).toBe("A1070");
  });

  it("should return public identifiers by status (inserted, edited, sipped, cancelled)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });

    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 3 }).map(_ =>
      getCorrectLine(company.orgId)
    );

    // Insert lines
    const res1 = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      { variables: { lines } }
    );
    expect(res1.data.addToSsdRegistry).toMatchObject({
      inserted: lines.map(({ publicId }) => ({ publicId })),
      edited: [],
      cancelled: [],
      skipped: []
    });

    // Edit, cancel and add already existing line that should be skipped
    const res2 = await mutate<Pick<Mutation, "addToSsdRegistry">>(
      ADD_TO_SSD_REGISTRY,
      {
        variables: {
          lines: [
            { ...lines[0], reason: "EDIT" },
            { ...lines[1], reason: "CANCEL" },
            lines[2]
          ]
        }
      }
    );

    expect(res2.errors).toBeUndefined();

    expect(res2.data.addToSsdRegistry).toMatchObject({
      inserted: [],
      edited: [expect.objectContaining({ publicId: lines[0].publicId })],
      cancelled: [expect.objectContaining({ publicId: lines[1].publicId })],
      skipped: [expect.objectContaining({ publicId: lines[2].publicId })]
    });
  });
});
