import type { Mutation } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { sub } from "date-fns";
import gql from "graphql-tag";
import { randomUUID } from "node:crypto";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_TO_INCOMING_WASTE_REGISTRY = gql`
  mutation AddToIncomingWasteRegistry($lines: [IncomingWasteLineInput!]!) {
    addToIncomingWasteRegistry(lines: $lines) {
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
  return {
    reason: undefined,
    publicId: randomUUID(),
    reportAsCompanySiret: undefined,
    reportForCompanySiret: siret,
    wasteDescription: "Dénomination du déchet",
    wasteCode: "06 07 01*",
    wasteCodeBale: "A1100",
    wastePop: false,
    wasteIsDangerous: true,
    receptionDate: sub(new Date(), { days: 5 }).toISOString(),
    weighingHour: "08:25",
    weightValue: 1.4,
    weightIsEstimate: true,
    volume: 1.2,
    initialEmitterCompanyType: "ETABLISSEMENT_FR",
    initialEmitterCompanyOrgId: "78467169500103",
    initialEmitterCompanyName: "Raison sociale du producteur",
    initialEmitterCompanyAddress: "Adresse du producteur",
    initialEmitterCompanyPostalCode: "75002",
    initialEmitterCompanyCity: "Commune du producteur",
    initialEmitterCompanyCountryCode: "FR",
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyType: "ETABLISSEMENT_FR",
    emitterCompanyOrgId: "78467169500103",
    emitterCompanyName: "Raison sociale de l'expéditeur",
    emitterCompanyAddress: "Adresse de l'expéditeur",
    emitterCompanyPostalCode: "75003",
    emitterCompanyCity: "Commune de l'expéditeur",
    emitterCompanyCountryCode: "FR",
    emitterPickupSiteName:
      "Référence du chantier / lieu de collecte de l'expéditeur",
    emitterPickupSiteAddress:
      "Libellé de l'adresse de prise en charge de l'expéditeur",
    emitterPickupSitePostalCode: "75012",
    emitterPickupSiteCity: "Commune de prise en charge de l'expéditeur",
    emitterPickupSiteCountryCode: "FR",
    brokerCompanySiret: null,
    brokerCompanyName: null,
    brokerRecepisseNumber: null,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderRecepisseNumber: null,
    ecoOrganismeSiret: null,
    ecoOrganismeName: null,
    operationCode: "R 5",
    operationMode: "RECYCLAGE",
    noTraceability: false,
    ttdImportNumber: null,
    movementNumber: null,
    nextOperationCode: null,
    transporter1TransportMode: "ROAD",
    transporter1CompanyType: "ETABLISSEMENT_FR",
    transporter1CompanyOrgId: "78467169500103",
    transporter1RecepisseIsExempted: false,
    transporter1RecepisseNumber: "Recepisse du transporteur n°1",
    transporter1CompanyName: "Raison sociale du transporteur n°1",
    transporter1CompanyAddress: "Adresse du transporteur n°1",
    transporter1CompanyPostalCode: "75001",
    transporter1CompanyCity: "Commune du transporteur n°1",
    transporter1CompanyCountryCode: "FR",
    transporter2TransportMode: undefined,
    transporter2CompanyType: undefined,
    transporter2CompanyOrgId: undefined,
    transporter2RecepisseIsExempted: undefined,
    transporter2RecepisseNumber: undefined,
    transporter2CompanyName: undefined,
    transporter2CompanyAddress: undefined,
    transporter2CompanyPostalCode: undefined,
    transporter2CompanyCity: undefined,
    transporter2CompanyCountryCode: undefined,
    transporter3TransportMode: undefined,
    transporter3CompanyType: undefined,
    transporter3CompanyOrgId: undefined,
    transporter3RecepisseIsExempted: undefined,
    transporter3RecepisseNumber: undefined,
    transporter3CompanyName: undefined,
    transporter3CompanyAddress: undefined,
    transporter3CompanyPostalCode: undefined,
    transporter3CompanyCity: undefined,
    transporter3CompanyCountryCode: undefined,
    transporter4TransportMode: undefined,
    transporter4CompanyType: undefined,
    transporter4CompanyOrgId: undefined,
    transporter4RecepisseIsExempted: undefined,
    transporter4RecepisseNumber: undefined,
    transporter4CompanyName: undefined,
    transporter4CompanyAddress: undefined,
    transporter4CompanyPostalCode: undefined,
    transporter4CompanyCity: undefined,
    transporter4CompanyCountryCode: undefined,
    transporter5TransportMode: undefined,
    transporter5CompanyType: undefined,
    transporter5CompanyOrgId: undefined,
    transporter5RecepisseIsExempted: undefined,
    transporter5RecepisseNumber: undefined,
    transporter5CompanyName: undefined,
    transporter5CompanyAddress: undefined,
    transporter5CompanyPostalCode: undefined,
    transporter5CompanyCity: undefined,
    transporter5CompanyCountryCode: undefined
  };
}

describe("Registry - addToIncomingWasteRegistry", () => {
  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "addToIncomingWasteRegistry">
    >(ADD_TO_INCOMING_WASTE_REGISTRY, { variables: { lines: [] } });
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
    const { errors } = await mutate<
      Pick<Mutation, "addToIncomingWasteRegistry">
    >(ADD_TO_INCOMING_WASTE_REGISTRY, { variables: { lines } });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous ne pouvez pas importer plus de 1000 lignes par appel"
      })
    );
  });

  it("should create an incoming waste item", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.siret!)];

    const { data } = await mutate<Pick<Mutation, "addToIncomingWasteRegistry">>(
      ADD_TO_INCOMING_WASTE_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingWasteRegistry.stats.insertions).toBe(1);
  });

  it("should create several incoming waste items", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingWasteRegistry">>(
      ADD_TO_INCOMING_WASTE_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingWasteRegistry.stats.insertions).toBe(100);
  });

  it("should create and edit an incoming waste item in one go", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.siret!);
    const editedLine = { ...line, reason: "EDIT", wasteCodeBale: "A1070" };
    const lines = [line, editedLine];

    const { data } = await mutate<Pick<Mutation, "addToIncomingWasteRegistry">>(
      ADD_TO_INCOMING_WASTE_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingWasteRegistry.stats.insertions).toBe(1);
    expect(data.addToIncomingWasteRegistry.stats.edits).toBe(1);

    const result = await prisma.registryIncomingWaste.findFirstOrThrow({
      where: { publicId: line.publicId, isLatest: true }
    });
    expect(result.wasteCodeBale).toBe("A1070");
  });

  it("should return public identifiers by status (inserted, edited, skipped, cancelled)", async () => {
    const { user, company } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 3 }).map(_ =>
      getCorrectLine(company.orgId)
    );

    // Insert lines
    const res1 = await mutate<Pick<Mutation, "addToIncomingWasteRegistry">>(
      ADD_TO_INCOMING_WASTE_REGISTRY,
      { variables: { lines } }
    );
    expect(res1.data.addToIncomingWasteRegistry).toMatchObject({
      inserted: lines.map(({ publicId }) => ({ publicId })),
      edited: [],
      cancelled: [],
      skipped: []
    });

    // Edit, cancel and add already existing line that should be skipped
    const res2 = await mutate<Pick<Mutation, "addToIncomingWasteRegistry">>(
      ADD_TO_INCOMING_WASTE_REGISTRY,
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

    expect(res2.data.addToIncomingWasteRegistry).toMatchObject({
      inserted: [],
      edited: [expect.objectContaining({ publicId: lines[0].publicId })],
      cancelled: [expect.objectContaining({ publicId: lines[1].publicId })],
      skipped: [expect.objectContaining({ publicId: lines[2].publicId })]
    });
  });
});
