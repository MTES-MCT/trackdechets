import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory,
  toIntermediaryCompany
} from "../../__tests__/factories";
import { getBsdasriForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bsdasriFactory } from "./factories";
import { BsdasriStatus, Company, WasteAcceptationStatus } from "@prisma/client";
import { xDaysAgo } from "../../utils";

import { prisma } from "@td/prisma";
import {
  Mutation,
  MutationCreateBsdasriRevisionRequestArgs
} from "@td/codegen-back";
import makeClient from "../../__tests__/testClient";
import gql from "graphql-tag";

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let transporter: Company;
  let destination: Company;
  let ecoOrganisme: Company;
  let bsdasri: any;
  let elasticBsdasri: BsdElastic;
  let intermediary1: Company;
  let intermediary2: Company;
  let broker: Company;
  let trader: Company;

  beforeAll(async () => {
    // Given
    emitter = await companyFactory({ name: "Emitter" });
    transporter = await companyFactory({
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    destination = await companyFactory({ name: "Destination" });
    ecoOrganisme = await companyFactory({ name: "EcoOrganisme" });
    intermediary1 = await companyFactory({ name: "Intermediaire 1" });
    intermediary2 = await companyFactory({ name: "Intermediaire 2" });
    broker = await companyFactory({ name: "Broker" });
    trader = await companyFactory({ name: "Trader" });
    bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        brokerCompanySiret: broker.siret,
        brokerCompanyName: broker.name,
        traderCompanySiret: trader.siret,
        traderCompanyName: trader.name,
        intermediaries: {
          createMany: {
            data: [
              toIntermediaryCompany(intermediary1),
              toIntermediaryCompany(intermediary2)
            ]
          }
        }
      }
    });

    const bsdasriForElastic = await getBsdasriForElastic(bsdasri);

    // When
    elasticBsdasri = toBsdElastic(bsdasriForElastic);
  });

  test("companyNames > should contain the names of ALL BSDASRI companies", async () => {
    // Then
    expect(elasticBsdasri.companyNames).toContain(emitter.name);
    expect(elasticBsdasri.companyNames).toContain(transporter.name);
    expect(elasticBsdasri.companyNames).toContain(destination.name);
    expect(elasticBsdasri.companyNames).toContain(ecoOrganisme.name);
    expect(elasticBsdasri.companyNames).toContain(intermediary1.name);
    expect(elasticBsdasri.companyNames).toContain(intermediary2.name);
    expect(elasticBsdasri.companyNames).toContain(broker.name);
    expect(elasticBsdasri.companyNames).toContain(trader.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSDASRI companies", async () => {
    // Then
    expect(elasticBsdasri.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsdasri.companyOrgIds).toContain(destination.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(ecoOrganisme.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(intermediary1.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(intermediary2.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(broker.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(trader.siret);
  });

  describe("isReturnFor", () => {
    it.each([
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ])(
      "waste acceptation status is %p > bsvhu should belong to tab",
      async destinationReceptionAcceptationStatus => {
        // Given
        const transporter = await companyFactory();
        const bsdasri = await bsdasriFactory({
          opt: {
            emitterCompanyName: emitter.name,
            emitterCompanySiret: emitter.siret,
            transporterCompanyName: transporter.name,
            transporterCompanySiret: transporter.siret,
            destinationReceptionDate: new Date(),
            destinationReceptionAcceptationStatus
          }
        });

        // When
        const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
        const { isReturnFor } = toBsdElastic(bsdasriForElastic);

        // Then
        expect(isReturnFor).toContain(transporter.siret);
      }
    );

    it("status is REFUSED > bsvhu should belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: new Date(),
          status: BsdasriStatus.REFUSED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toContain(transporter.siret);
    });

    it("waste acceptation status is ACCEPTED > bsvhu should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: new Date(),
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });

    it("bsda has been received too long ago > should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: xDaysAgo(new Date(), 10),
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });
  });

  describe("isArchivedFor", () => {
    it("DASRI is cancelled > should belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const destination = await companyFactory();
      const ecoOrganisme = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          status: "CANCELED",
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationCompanySiret: destination.siret,
          ecoOrganismeSiret: ecoOrganisme.siret
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const {
        isArchivedFor,
        isDraftFor,
        isForActionFor,
        isFollowFor,
        isToCollectFor,
        isCollectedFor
      } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isDraftFor).toStrictEqual([]);
      expect(isForActionFor).toStrictEqual([]);
      expect(isFollowFor).toStrictEqual([]);
      expect(isToCollectFor).toStrictEqual([]);
      expect(isCollectedFor).toStrictEqual([]);
      expect(isArchivedFor.sort()).toStrictEqual(
        [
          emitter.siret,
          transporter.siret,
          destination.siret,
          ecoOrganisme.siret
        ].sort()
      );
    });
  });

  test("if no revision request > nonPendingLatestRevisionRequestUpdatedAt should be undefined", async () => {
    // Given
    const bsdasri = await bsdasriFactory({});

    // When
    const bsdaForElastic = await getBsdasriForElastic(bsdasri);
    const { nonPendingLatestRevisionRequestUpdatedAt } =
      toBsdElastic(bsdaForElastic);

    // Then
    expect(nonPendingLatestRevisionRequestUpdatedAt).toBeUndefined();
  });

  test("if revision request > should populate nonPendingLatestRevisionRequestUpdatedAt", async () => {
    // Given
    const emitter = await userWithCompanyFactory();
    const destination = await userWithCompanyFactory("ADMIN", {
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: ["DANGEROUS_WASTES_INCINERATION"]
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "PROCESSED",
        emitterCompanyName: emitter.company.name,
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret
      }
    });

    const { mutate } = makeClient(destination.user);
    const CREATE_BSDASRI_REVISION_REQUEST = gql`
      mutation CreateBsdasriRevisionRequest(
        $input: CreateBsdasriRevisionRequestInput!
      ) {
        createBsdasriRevisionRequest(input: $input) {
          id
        }
      }
    `;

    const { errors, data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          authoringCompanySiret: destination.company.siret!,
          comment: "oups",
          content: { waste: { code: "18 02 02*" } }
        }
      }
    });
    expect(errors).toBeUndefined();

    const revision = await prisma.bsdasriRevisionRequest.update({
      where: {
        id: data.createBsdasriRevisionRequest.id
      },
      data: {
        status: "ACCEPTED"
      }
    });

    // When
    const bsdaForElastic = await getBsdasriForElastic(bsdasri);
    const { nonPendingLatestRevisionRequestUpdatedAt } =
      toBsdElastic(bsdaForElastic);

    // Then
    expect(nonPendingLatestRevisionRequestUpdatedAt).toBe(
      revision.updatedAt.getTime()
    );
  });
});
