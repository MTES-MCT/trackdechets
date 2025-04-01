import type { Mutation } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { sub } from "date-fns";
import gql from "graphql-tag";
import { randomUUID } from "node:crypto";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_TO_OUTGOING_TEXS_REGISTRY = gql`
  mutation AddToOutgoingTexsRegistry($lines: [OutgoingTexsLineInput!]!) {
    addToOutgoingTexsRegistry(lines: $lines) {
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
      inserted
      edited
      cancelled
      skipped
    }
  }
`;

function getCorrectLine(siret: string) {
  return {
    reason: undefined,
    publicId: randomUUID(),
    reportAsCompanySiret: undefined,
    reportForCompanySiret: siret,
    reportForPickupSiteName: undefined,
    reportForPickupSiteAddress: undefined,
    reportForPickupSitePostalCode: undefined,
    reportForPickupSiteCity: undefined,
    reportForPickupSiteCountryCode: undefined,
    wasteDescription: "Dénomination du déchet",
    wasteCode: "17 05 03*",
    wasteCodeBale: "A1100",
    wastePop: false,
    wasteIsDangerous: true,
    dispatchDate: sub(new Date(), { days: 5 }).toISOString(),
    wasteDap: "aa",
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
    parcelInseeCodes: undefined,
    parcelNumbers: undefined,
    parcelCoordinates: ["47.829864 1.937389", "48.894258 2.240027"],
    sisIdentifier: undefined,
    destinationCompanyType: "ETABLISSEMENT_FR",
    destinationCompanyOrgId: "78467169500103",
    destinationCompanyName: "Raison sociale de l'expéditeur",
    destinationCompanyAddress: "Adresse de l'expéditeur",
    destinationCompanyPostalCode: "75003",
    destinationCompanyCity: "Commune de l'expéditeur",
    destinationCompanyCountryCode: "FR",
    destinationDropSiteAddress:
      "Libellé de l'adresse de prise en charge de l'expéditeur",
    destinationDropSitePostalCode: "75012",
    destinationDropSiteCity: "Commune de prise en charge de l'expéditeur",
    destinationDropSiteCountryCode: "FR",
    operationCode: "R 5",
    operationMode: "RECYCLAGE",
    isUpcycled: false,
    destinationParcelInseeCodes: undefined,
    destinationParcelNumbers: undefined,
    destinationParcelCoordinates: undefined,
    gistridNumber: null,
    movementNumber: null,
    brokerCompanySiret: null,
    brokerCompanyName: null,
    brokerRecepisseNumber: null,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderRecepisseNumber: null,
    ecoOrganismeSiret: null,
    ecoOrganismeName: null,
    isDirectSupply: false,
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

describe("Registry - addToOutgoingTexsRegistry", () => {
  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "addToOutgoingTexsRegistry">
    >(ADD_TO_OUTGOING_TEXS_REGISTRY, { variables: { lines: [] } });
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
      Pick<Mutation, "addToOutgoingTexsRegistry">
    >(ADD_TO_OUTGOING_TEXS_REGISTRY, { variables: { lines } });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous ne pouvez pas importer plus de 1000 lignes par appel"
      })
    );
  });

  it("should create an outgoing texs item", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.siret!)];

    const { data } = await mutate<Pick<Mutation, "addToOutgoingTexsRegistry">>(
      ADD_TO_OUTGOING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToOutgoingTexsRegistry.stats.insertions).toBe(1);
  });

  it("should create several outgoing texs items", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToOutgoingTexsRegistry">>(
      ADD_TO_OUTGOING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToOutgoingTexsRegistry.stats.insertions).toBe(100);
  });

  it("should create and edit an outgoing texs item in one go", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.siret!);
    const editedLine = { ...line, reason: "EDIT", wasteCodeBale: "A1070" };
    const lines = [line, editedLine];

    const { data } = await mutate<Pick<Mutation, "addToOutgoingTexsRegistry">>(
      ADD_TO_OUTGOING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToOutgoingTexsRegistry.stats.insertions).toBe(1);
    expect(data.addToOutgoingTexsRegistry.stats.edits).toBe(1);

    const result = await prisma.registryOutgoingTexs.findFirstOrThrow({
      where: { publicId: line.publicId, isLatest: true }
    });
    expect(result.wasteCodeBale).toBe("A1070");
  });

  it("should return public identifiers by status (inserted, edited, sipped, cancelled)", async () => {
    const { user, company } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 3 }).map(_ =>
      getCorrectLine(company.orgId)
    );

    // Insert lines
    const res1 = await mutate<Pick<Mutation, "addToOutgoingTexsRegistry">>(
      ADD_TO_OUTGOING_TEXS_REGISTRY,
      { variables: { lines } }
    );
    expect(res1.data.addToOutgoingTexsRegistry).toMatchObject({
      inserted: lines.map(l => l.publicId),
      edited: [],
      cancelled: [],
      skipped: []
    });

    // Edit, cancel and add already existing line that should be skipped
    const res2 = await mutate<Pick<Mutation, "addToOutgoingTexsRegistry">>(
      ADD_TO_OUTGOING_TEXS_REGISTRY,
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

    expect(res2.data.addToOutgoingTexsRegistry).toMatchObject({
      inserted: [],
      edited: [lines[0].publicId],
      cancelled: [lines[1].publicId],
      skipped: [lines[2].publicId]
    });
  });
});
