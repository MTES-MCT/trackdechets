import { Mutation, Query } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { randomUUID } from "crypto";
import { sub } from "date-fns";
import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_TO_INCOMING_TEXS_REGISTRY = gql`
  mutation AddToIncomingTexsRegistry($lines: [IncomingTexsLineInput!]!) {
    addToIncomingTexsRegistry(lines: $lines) {
      stats {
        insertions
      }
    }
  }
`;

const GET_REGISTRY_CHANGE_AGGREGATES = gql`
  query RegistryChangeAggregates($siret: String!, $window: Int!) {
    registryChangeAggregates(siret: $siret, window: $window, source: API) {
      numberOfInsertions
      numberOfSkipped
      numberOfErrors
      numberOfEdits
      numberOfCancellations
      numberOfAggregates
    }
  }
`;

function getIncomingTexsLine(siret: string) {
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

describe("Registry - registryChangeAggregates", () => {
  afterEach(resetDatabase);

  it("should create a ChangeAggregate when creating several incoming texs items", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate, query } = makeClient(user);

    const lines = Array.from({ length: 100 }, () =>
      getIncomingTexsLine(company.siret!)
    );

    await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id }
    });

    expect(changeAggregates.length).toBe(1);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);

    const { data } = await query<Pick<Query, "registryChangeAggregates">>(
      GET_REGISTRY_CHANGE_AGGREGATES,
      { variables: { siret: company.siret, window: 1 } }
    );

    expect(data.registryChangeAggregates?.length).toBe(1);
    expect(data.registryChangeAggregates?.[0].numberOfInsertions).toBe(100);
  });

  it("should amend previous ChangeAggregate when creating incoming texs items less than 1 min after previous creation", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate, query } = makeClient(user);

    // Existing aggregate that should be incremented
    await prisma.registryChangeAggregate.create({
      data: {
        source: "API",
        type: "INCOMING_TEXS",
        createdById: user.id,
        numberOfInsertions: 1,
        numberOfSkipped: 1,
        numberOfErrors: 1,
        numberOfEdits: 1,
        numberOfCancellations: 1,
        numberOfAggregates: 1,
        reportForId: company.id,
        reportAsId: company.id
      }
    });

    const lines = Array.from({ length: 100 }, () =>
      getIncomingTexsLine(company.siret!)
    );

    await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id }
    });

    expect(changeAggregates.length).toBe(1);
    expect(changeAggregates[0].numberOfInsertions).toBe(101);

    expect(changeAggregates[0].numberOfSkipped).toBe(1);
    expect(changeAggregates[0].numberOfErrors).toBe(1);
    expect(changeAggregates[0].numberOfEdits).toBe(1);
    expect(changeAggregates[0].numberOfCancellations).toBe(1);

    expect(changeAggregates[0].numberOfAggregates).toBe(2);

    const { data } = await query<Pick<Query, "registryChangeAggregates">>(
      GET_REGISTRY_CHANGE_AGGREGATES,
      { variables: { siret: company.siret, window: 1 } }
    );
    expect(data.registryChangeAggregates?.length).toBe(1);
    expect(data.registryChangeAggregates?.[0].numberOfInsertions).toBe(101);
  });

  it("should create a ChangeAggregate when creating incoming texs items more than 1 min after previous creation", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    // Existing aggregate with more than 2 min since the last update
    const date = sub(new Date(), { minutes: 2 });
    await prisma.registryChangeAggregate.create({
      data: {
        createdAt: date,
        updatedAt: date,
        source: "API",
        type: "INCOMING_TEXS",
        createdById: user.id,
        numberOfInsertions: 1,
        numberOfSkipped: 1,
        numberOfErrors: 1,
        numberOfEdits: 1,
        numberOfCancellations: 1,
        numberOfAggregates: 1,
        reportForId: company.id,
        reportAsId: company.id
      }
    });

    const lines = Array.from({ length: 100 }, () =>
      getIncomingTexsLine(company.siret!)
    );

    await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" }
    });

    expect(changeAggregates.length).toBe(2);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);
    expect(changeAggregates[1].numberOfInsertions).toBe(1);
  });

  it("should create a ChangeAggregate when creating incoming texs items with updatedAt<1min & createdAt>5min", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { mutate, query } = makeClient(user);

    // Existing aggregate updated now but created 6min ago
    await prisma.registryChangeAggregate.create({
      data: {
        createdAt: sub(new Date(), { minutes: 6 }),
        updatedAt: new Date(),
        source: "API",
        type: "INCOMING_TEXS",
        createdById: user.id,
        numberOfInsertions: 1,
        numberOfSkipped: 1,
        numberOfErrors: 1,
        numberOfEdits: 1,
        numberOfCancellations: 1,
        numberOfAggregates: 1,
        reportForId: company.id,
        reportAsId: company.id
      }
    });

    const lines = Array.from({ length: 100 }, () =>
      getIncomingTexsLine(company.siret!)
    );

    await mutate<Pick<Mutation, "addToIncomingTexsRegistry">>(
      ADD_TO_INCOMING_TEXS_REGISTRY,
      { variables: { lines } }
    );

    const changeAggregates = await prisma.registryChangeAggregate.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" }
    });

    expect(changeAggregates.length).toBe(2);
    expect(changeAggregates[0].numberOfInsertions).toBe(100);
    expect(changeAggregates[1].numberOfInsertions).toBe(1);

    const { data } = await query<Pick<Query, "registryChangeAggregates">>(
      GET_REGISTRY_CHANGE_AGGREGATES,
      { variables: { siret: company.siret, window: 1 } }
    );
    expect(data.registryChangeAggregates?.length).toBe(2);
    expect(data.registryChangeAggregates?.[0].numberOfInsertions).toBe(100);
  });
});
