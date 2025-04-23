import type { Mutation } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { sub } from "date-fns";
import gql from "graphql-tag";
import { randomUUID } from "node:crypto";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_TO_INCOMING_TEXS_REGISTRY = gql`
  mutation AddToIncomingTexsRegistry($lines: [IncomingTexsLineInput!]!) {
    addToIncomingTexsRegistry(lines: $lines) {
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
    wasteCode: "17 05 03*",
    wasteCodeBale: "A1100",
    wastePop: false,
    wasteIsDangerous: true,
    receptionDate: sub(new Date(), { days: 5 }).toISOString(),
    weightValue: 1.4,
    weightIsEstimate: true,
    volume: 1.2,
    parcelCoordinates: ["47.829864 1.937389", "48.894258 2.240027"],
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
    operationCode: "R 5",
    operationMode: "RECYCLAGE",
    noTraceability: false,
    nextDestinationIsAbroad: false,
    isUpcycled: false,
    gistridNumber: null,
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

describe("Registry - addToIncomingTexsRegistry", () => {
  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "addToIncomingTexsRegistry">
    >(ADD_TO_INCOMING_TEXS_REGISTRY, { variables: { lines: [] } });
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
      Pick<Mutation, "addToIncomingTexsRegistry">
    >(ADD_TO_INCOMING_TEXS_REGISTRY, { variables: { lines } });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous ne pouvez pas importer plus de 1000 lignes par appel"
      })
    );
  });

  it("should create an incoming texs item", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.siret!)];

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(1);
  });

  it("should create several incoming texs items", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(100);
  });

  it("should create and edit an incoming texs item in one go", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.siret!);
    const editedLine = { ...line, reason: "EDIT", wasteCodeBale: "A1070" };
    const lines = [line, editedLine];

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(1);
    expect(data.addToIncomingTexsRegistry.stats.edits).toBe(1);

    const result = await prisma.registryIncomingTexs.findFirstOrThrow({
      where: { publicId: line.publicId, isLatest: true }
    });
    expect(result.wasteCodeBale).toBe("A1070");
  });

  it("should create a ChangeAggregate when creating several incoming texs items", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(100);

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id }
    });

    expect(changeAggregates.length).toBe(1);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);
  });

  it("should amend to previous ChangeAggregate when creating incoming texs items less than 1 min after previous creation", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(100);

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id }
    });

    expect(changeAggregates.length).toBe(1);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);
  });

  it("should create a ChangeAggregate when creating incoming texs items more than 1 min after previous creation", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(100);

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id }
    });

    expect(changeAggregates.length).toBe(1);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);
  });

  it("should work if the current user has delegation rights on the reportFor siret", async () => {
    const { company } = await userWithCompanyFactory();
    const { user, company: delegateCompany } = await userWithCompanyFactory();

    await prisma.registryDelegation.create({
      data: {
        startDate: new Date(),
        delegateId: delegateCompany.id,
        delegatorId: company.id
      }
    });
    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () => ({
      ...getCorrectLine(company.siret!),
      reportAsCompanySiret: delegateCompany.orgId
    }));

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.insertions).toBe(100);
  });

  it("should fail if the current user does not belong to or have delegation rights on the reportFor siret", async () => {
    const { company } = await userWithCompanyFactory();
    const { user } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getCorrectLine(company.siret!)
    );

    const { data } = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    expect(data.addToIncomingTexsRegistry.stats.errors).toBe(100);
    expect(data.addToIncomingTexsRegistry.errors![0].message).toBe(
      "Vous ne pouvez pas déclarer pour ce SIRET dans la mesure où votre compte utilisateur n'y est pas rattaché et qu'aucune délégation est en cours"
    );
  });

  it("should allow to edit a line that has been cancelled before", async () => {
    const { user, company } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const line = getCorrectLine(company.orgId);

    // First create
    const res1 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines: [line] } }
    );
    expect(res1.data.addToIncomingTexsRegistry.stats.insertions).toBe(1);

    // Then cancel
    const res2 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines: [{ ...line, reason: "CANCEL" }] } }
    );
    expect(res2.data.addToIncomingTexsRegistry.stats.cancellations).toBe(1);

    // Then edit
    const res3 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines: [{ ...line, reason: "EDIT" }] } }
    );
    expect(res3.data.addToIncomingTexsRegistry.stats.edits).toBe(1);
  });

  it("should return public identifiers by status (inserted, edited, skipped, cancelled)", async () => {
    const { user, company } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const lines = Array.from({ length: 3 }).map(_ =>
      getCorrectLine(company.orgId)
    );

    // Insert lines
    const res1 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );
    expect(res1.data.addToIncomingTexsRegistry).toMatchObject({
      inserted: lines.map(({ publicId }) => ({ publicId })),
      edited: [],
      cancelled: [],
      skipped: []
    });

    // Edit, cancel and add already existing line that should be skipped
    const res2 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
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

    expect(res2.data.addToIncomingTexsRegistry).toMatchObject({
      inserted: [],
      edited: [expect.objectContaining({ publicId: lines[0].publicId })],
      cancelled: [expect.objectContaining({ publicId: lines[1].publicId })],
      skipped: [expect.objectContaining({ publicId: lines[2].publicId })]
    });
  });

  it("should allow re-creating a line that was cancelled without passing a reason", async () => {
    const { user, company } = await userWithCompanyFactory();

    const { mutate } = makeClient(user);

    const lines = [getCorrectLine(company.orgId)];

    // Insert line
    const res1 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );
    expect(res1.errors).toBeUndefined();
    expect(res1.data.addToIncomingTexsRegistry.stats.insertions).toBe(1);

    // Cancel already existing line
    const res2 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      {
        variables: {
          lines: [{ ...lines[0], reason: "CANCEL" }]
        }
      }
    );
    expect(res2.errors).toBeUndefined();
    expect(res2.data.addToIncomingTexsRegistry.stats.cancellations).toBe(1);

    // Now re-create the line without passing a reason
    const res3 = await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );
    expect(res3.errors).toBeUndefined();
    expect(res3.data.addToIncomingTexsRegistry.stats.insertions).toBe(0); // It's not an insertion
    expect(res3.data.addToIncomingTexsRegistry.stats.edits).toBe(1); // It's an edit, even if no reason was passed in
  });
});
