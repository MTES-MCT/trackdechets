import type { Mutation } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import gql from "graphql-tag";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { randomUUID } from "node:crypto";
import { prisma } from "@td/prisma";
import { sub } from "date-fns";

const ADD_TO_TRANSPORTED_REGISTRY = gql`
  mutation AddToTransportedRegistry($lines: [TransportedLineInput!]!) {
    addToTransportedRegistry(lines: $lines)
  }
`;

function getCorrectLine(siret: string) {
  return {
    reason: undefined,
    publicId: randomUUID(),
    reportAsCompanySiret: undefined,
    reportForCompanySiret: siret,
    reportForTransportMode: "ROAD",
    reportForTransportIsWaste: true,
    reportForRecepisseIsExempted: false,
    reportForRecepisseNumber: "recepisse",
    reportForTransportAdr: "adr",
    reportForTransportOtherTmdCode: "code tmd",
    reportForTransportPlates: ["aa123bb", "bb321aa"],
    wasteDescription: "Dénomination du déchet",
    wasteCode: "06 07 01*",
    wasteCodeBale: "A1100",
    wastePop: false,
    wasteIsDangerous: true,
    collectionDate: sub(new Date(), { days: 5 }).toISOString(),
    unloadingDate: sub(new Date(), { days: 2 }).toISOString(),
    weightValue: 1.4,
    weightIsEstimate: true,
    volume: 1.2,
    emitterCompanyType: "ETABLISSEMENT_FR",
    emitterCompanyOrgId: "78467169500103",
    emitterCompanyName: "Nom émetteur",
    emitterCompanyAddress: "Adresse émetteur",
    emitterCompanyPostalCode: "75001",
    emitterCompanyCity: "Ville émetteur",
    emitterCompanyCountryCode: "FR",
    emitterPickupSiteName: undefined,
    emitterPickupSiteAddress: undefined,
    emitterPickupSitePostalCode: undefined,
    emitterPickupSiteCity: undefined,
    emitterPickupSiteCountryCode: undefined,
    destinationCompanyType: "ETABLISSEMENT_FR",
    destinationCompanyOrgId: "78467169500103",
    destinationCompanyName: "Nom destination",
    destinationCompanyAddress: "Adresse destination",
    destinationCompanyCity: "Ville destination",
    destinationCompanyPostalCode: "75001",
    destinationCompanyCountryCode: "FR",
    destinationDropSiteAddress: undefined,
    destinationDropSitePostalCode: undefined,
    destinationDropSiteCity: undefined,
    destinationDropSiteCountryCode: undefined,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    brokerCompanySiret: null,
    brokerCompanyName: null,
    brokerRecepisseNumber: null,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderRecepisseNumber: null,
    ecoOrganismeSiret: null,
    ecoOrganismeName: null
  };
}

describe("Registry - addToTransportedRegistry", () => {
  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "addToTransportedRegistry">>(
      ADD_TO_TRANSPORTED_REGISTRY,
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
    const { errors } = await mutate<Pick<Mutation, "addToTransportedRegistry">>(
      ADD_TO_TRANSPORTED_REGISTRY,
      { variables: { lines } }
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous ne pouvez pas importer plus de 1000 lignes par appel"
      })
    );
  });

  it("should create a transported item", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.siret!)];

    const { data } = await mutate<Pick<Mutation, "addToTransportedRegistry">>(
      ADD_TO_TRANSPORTED_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToTransportedRegistry).toBe(true);
  });

  it("should create several transported items", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToTransportedRegistry">>(
      ADD_TO_TRANSPORTED_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToTransportedRegistry).toBe(true);
  });

  it("should create and edit a transported item in one go", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["RECOVERY_FACILITY"] }
    });
    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.siret!);
    const editedLine = { ...line, reason: "EDIT", wasteCodeBale: "A1070" };
    const lines = [line, editedLine];

    const { data } = await mutate<Pick<Mutation, "addToTransportedRegistry">>(
      ADD_TO_TRANSPORTED_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToTransportedRegistry).toBe(true);

    const result = await prisma.registryTransported.findFirstOrThrow({
      where: { publicId: line.publicId, isLatest: true }
    });
    expect(result.wasteCodeBale).toBe("A1070");
  });
});
