import {
  BsdasriStatus,
  BsdaStatus,
  BsffStatus,
  BspaohStatus,
  BsvhuStatus,
  Status,
  WasteAcceptationStatus
} from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  BsdIndexationConfig,
  client,
  index as globalIndex
} from "../../common/elastic";
import { reindexAllBsdsInBulk } from "../../bsds/indexation";
import {
  cleanUpIsReturnForTab,
  cleanUpIsReviewedRevisionForTab
} from "../elasticHelpers";
import { xDaysAgo } from "../../utils";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { createBsff } from "../../bsffs/__tests__/factories";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { bspaohFactory } from "../../bspaoh/__tests__/factories";
import { addMonths, addYears } from "date-fns";
import { isDefined } from "../helpers";

describe("elasticHelpers", () => {
  // do not use INDEX_ALIAS_NAME_SEPARATOR
  const testAlias = "testbsds";

  const testIndex: BsdIndexationConfig = {
    ...globalIndex,
    alias: testAlias
  };

  async function deleteTestIndexes() {
    await client.indices.delete({ index: `${testAlias}*` }, { ignore: [404] });
  }

  afterEach(async () => {
    await resetDatabase();
    await deleteTestIndexes();
  });

  const reindex = async () => {
    await reindexAllBsdsInBulk({ index: testIndex });
    await client.indices.refresh({
      index: testIndex.alias
    });
  };

  interface CreateOpt {
    wasteAcceptationStatus: WasteAcceptationStatus;
  }

  const seedBsdd = async (opt?: CreateOpt) => {
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.RECEIVED,
        receivedAt: new Date(),
        wasteAcceptationStatus:
          opt?.wasteAcceptationStatus ??
          WasteAcceptationStatus.PARTIALLY_REFUSED
      }
    });

    return bsdd;
  };

  const seedBsda = async (opt?: CreateOpt) => {
    const user = await userFactory();
    const bsda = await bsdaFactory({
      userId: user.id,
      opt: {
        status: BsdaStatus.PROCESSED,
        destinationReceptionDate: new Date(),
        destinationReceptionAcceptationStatus:
          opt?.wasteAcceptationStatus ??
          WasteAcceptationStatus.PARTIALLY_REFUSED
      }
    });

    return bsda;
  };

  const seedBsff = async (opt?: CreateOpt) => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsff = await createBsff(
      { emitter },
      {
        data: {
          status: BsffStatus.RECEIVED,
          destinationReceptionDate: new Date()
        },
        packagingData: {
          acceptationStatus:
            opt?.wasteAcceptationStatus ??
            WasteAcceptationStatus.PARTIALLY_REFUSED
        },
        transporterData: {
          transporterCompanySiret: transporter.siret
        }
      }
    );

    return bsff;
  };

  const seedBsdasri = async (opt?: CreateOpt) => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsdasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: emitter.company?.siret,
        destinationReceptionDate: new Date(),
        destinationReceptionAcceptationStatus:
          opt?.wasteAcceptationStatus ??
          WasteAcceptationStatus.PARTIALLY_REFUSED,
        transporterCompanySiret: transporter.siret
      }
    });

    return bsdasri;
  };

  const seedBsvhu = async (opt?: CreateOpt) => {
    const transporter = await companyFactory();
    const bsvhu = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.PROCESSED,
        destinationReceptionDate: new Date(),
        destinationReceptionAcceptationStatus:
          opt?.wasteAcceptationStatus ??
          WasteAcceptationStatus.PARTIALLY_REFUSED,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    return bsvhu;
  };

  const seedBspaoh = async (opt?: CreateOpt) => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.RECEIVED,
        destinationReceptionDate: new Date(),
        destinationReceptionAcceptationStatus:
          opt?.wasteAcceptationStatus ??
          WasteAcceptationStatus.PARTIALLY_REFUSED
      }
    });

    return bspaoh;
  };

  describe("cleanUpIsReturnForTab", () => {
    const countIsReturnForBSDs = async () => {
      const countResponse1 = await client.count({
        index: testIndex.alias,
        body: {
          query: {
            bool: {
              must: {
                exists: {
                  field: "isReturnFor"
                }
              }
            }
          }
        }
      });

      return countResponse1.body.count;
    };

    const changeBSDDestinationReceptionDateInES = async (
      bsdId: string,
      date: Date
    ) => {
      await client.updateByQuery({
        index: testIndex.alias,
        refresh: true,
        body: {
          query: {
            match: {
              id: bsdId
            }
          },
          script: {
            source:
              `ctx._source.destinationReceptionDate = ` +
              `new SimpleDateFormat('yyyy-MM-dd').parse('${
                date.toISOString().split("T")[0]
              }')`
          }
        }
      });
    };

    describe.each([
      ["BSDD", seedBsdd],
      ["BSDA", seedBsda],
      ["BSFF", seedBsff],
      ["BSDASRI", seedBsdasri],
      ["BSVHU", seedBsvhu],
      ["BSPAOH", seedBspaoh]
    ])("%p", (_, bsdCreate) => {
      it("should not remove fresh BSDs", async () => {
        // Given
        await bsdCreate();
        await reindex();

        // There should be 1 BSD in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(1);

        // Given: now clean up isReturnFor tab
        await cleanUpIsReturnForTab(testIndex.alias);

        const count2 = await countIsReturnForBSDs();
        expect(count2).toEqual(1);
      });

      it("should remove outdated BSDs", async () => {
        // Given
        const bsdd = await bsdCreate();
        await reindex();

        // There should be 1 BSD in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(1);

        // Given
        // Manually outdate BSD
        await changeBSDDestinationReceptionDateInES(
          bsdd.id,
          xDaysAgo(new Date(), 3)
        );

        // Clean up tab
        await cleanUpIsReturnForTab(testIndex.alias);

        // BSD should have disappeared
        const count2 = await countIsReturnForBSDs();
        expect(count2).toEqual(0);
      });

      it("should not touch unconcerned BSDs", async () => {
        // Given
        const bsdd = await bsdCreate();
        // Shall NOT go to isReturnFor tab
        await bsdCreate({
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED
        });
        await reindex();

        // There should be 1 BSD in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(1);

        // Manually outdate BSD
        await changeBSDDestinationReceptionDateInES(
          bsdd.id,
          xDaysAgo(new Date(), 3)
        );

        // Given
        const body = await cleanUpIsReturnForTab(testIndex.alias);

        // BSD should have disappeared
        expect(body.updated).toEqual(1);
      });
    });

    describe("all BSDs mixed together", () => {
      it("should not remove fresh BSDs", async () => {
        // Given
        await seedBsda();
        await seedBsdasri();
        await seedBsdd();
        await seedBsff();
        await seedBspaoh();
        await seedBsvhu();
        await reindex();

        // There should be 6 BSDs in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(6);

        // Given: now clean up isReturnFor tab
        await cleanUpIsReturnForTab(testIndex.alias);

        const count2 = await countIsReturnForBSDs();
        expect(count2).toEqual(6);
      });

      it("should remove outdated BSDs", async () => {
        // Given
        const bsda = await seedBsda();
        const bsdasri = await seedBsdasri();
        const bsdd = await seedBsdd();
        const bsff = await seedBsff();
        const bspaoh = await seedBspaoh();
        const bsvhu = await seedBsvhu();
        await reindex();

        // There should be 6 BSDs in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(6);

        // Given
        // Manually outdate BSD
        const THREE_DAYS_AGO = xDaysAgo(new Date(), 3);
        await changeBSDDestinationReceptionDateInES(bsda.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsdasri.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsdd.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsff.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bspaoh.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsvhu.id, THREE_DAYS_AGO);

        // Clean up tab
        await cleanUpIsReturnForTab(testIndex.alias);

        // BSDs should have disappeared
        const count2 = await countIsReturnForBSDs();
        expect(count2).toEqual(0);
      });

      it("should not touch unconcerned BSDs", async () => {
        // Given
        const bsda = await seedBsda();
        const bsdasri = await seedBsdasri();
        const bsdd = await seedBsdd();
        const bsff = await seedBsff();
        const bspaoh = await seedBspaoh();
        const bsvhu = await seedBsvhu();
        // Shall NOT go to isReturnFor tab
        const opt = { wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED };
        await seedBsda(opt);
        await seedBsdasri(opt);
        await seedBsdd(opt);
        await seedBsff(opt);
        await seedBspaoh(opt);
        await seedBsvhu(opt);
        await reindex();

        // There should be 1 BSD in the isReturnFor tab
        const count1 = await countIsReturnForBSDs();
        expect(count1).toEqual(6);

        // Manually outdate BSD
        const THREE_DAYS_AGO = xDaysAgo(new Date(), 3);
        await changeBSDDestinationReceptionDateInES(bsda.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsdasri.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsdd.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsff.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bspaoh.id, THREE_DAYS_AGO);
        await changeBSDDestinationReceptionDateInES(bsvhu.id, THREE_DAYS_AGO);

        // Given
        const body = await cleanUpIsReturnForTab(testIndex.alias);

        // BSDs should have disappeared
        expect(body.updated).toEqual(6);
      });
    });
  });

  describe("cleanUpIsReviewedRevisionForTab", () => {
    const changeRevisionUpdatedAtAndRevisionTab = async (
      bsdId: string,
      nonPendingLatestRevisionRequestUpdatedAt: Date,
      isReviewedRevisionFor: string[]
    ) => {
      const source =
        ` ctx._source.nonPendingLatestRevisionRequestUpdatedAt = ` +
        `new SimpleDateFormat('yyyy-MM-dd').parse('${
          nonPendingLatestRevisionRequestUpdatedAt.toISOString().split("T")[0]
        }'); ctx._source.isReviewedRevisionFor = ${JSON.stringify(
          isReviewedRevisionFor
        )}`;

      await client.updateByQuery({
        index: testIndex.alias,
        refresh: true,
        body: {
          query: {
            match: {
              id: bsdId
            }
          },
          script: {
            source
          }
        }
      });
    };

    const getESBsds = async () => {
      const response = await client.search({
        index: testIndex.alias
      });

      return response.body.hits.hits.map(hit => hit._source);
    };

    describe("all BSDs mixed together", () => {
      const EIGHTEEN_MONTHS_AGO = addMonths(new Date(), -18);
      const NINETEEN_MONTHS_AGO = addMonths(new Date(), -19);
      const THREE_MONTHS_AGO = addMonths(new Date(), -3);
      const ONE_MONTH_AGO = addMonths(new Date(), -1);
      const TWO_YEARS_AGO = addYears(new Date(), -2);
      const TODAY = new Date();

      it("should remove old revisions", async () => {
        // Given
        const bsda = await seedBsda();
        const bsdasri = await seedBsdasri();
        const bsdd = await seedBsdd();
        const bsff = await seedBsff();
        const bspaoh = await seedBspaoh();
        const bsvhu = await seedBsvhu();
        await reindex();

        // Manually update BSDs to add false revision fields
        await changeRevisionUpdatedAtAndRevisionTab(
          bsda.id,
          EIGHTEEN_MONTHS_AGO,
          [bsda.emitterCompanySiret!]
        );
        await changeRevisionUpdatedAtAndRevisionTab(
          bsdasri.id,
          NINETEEN_MONTHS_AGO,
          [bsdasri.emitterCompanySiret!]
        );
        await changeRevisionUpdatedAtAndRevisionTab(
          bsdd.id,
          NINETEEN_MONTHS_AGO,
          [bsdd.emitterCompanySiret!]
        );
        await changeRevisionUpdatedAtAndRevisionTab(bsff.id, TWO_YEARS_AGO, [
          bsff.emitterCompanySiret!
        ]);
        await changeRevisionUpdatedAtAndRevisionTab(
          bspaoh.id,
          EIGHTEEN_MONTHS_AGO,
          [bspaoh.emitterCompanySiret!]
        );
        await changeRevisionUpdatedAtAndRevisionTab(bsvhu.id, TWO_YEARS_AGO, [
          bsvhu.emitterCompanySiret!
        ]);

        // BSDs should all have old revision data
        const bsds = await getESBsds();
        expect(bsds.length).toEqual(6);
        expect(
          bsds.find(b => !isDefined(b.nonPendingLatestRevisionRequestUpdatedAt))
        ).toBeUndefined();
        expect(bsds.find(b => !b.isReviewedRevisionFor.length)).toBeUndefined();

        // Given
        const body = await cleanUpIsReviewedRevisionForTab(testIndex.alias);

        // BSDs should have disappeared
        expect(body.updated).toEqual(6);

        // BSDs should all have old revision data
        const updatedBsds = await getESBsds();

        expect(updatedBsds.length).toEqual(6);
        expect(
          updatedBsds.filter(
            b => !isDefined(b.nonPendingLatestRevisionRequestUpdatedAt)
          ).length
        ).toEqual(6);
        expect(
          updatedBsds.filter(b => !b.isReviewedRevisionFor.length).length
        ).toEqual(6);
      });

      it("should not remove recent revisions", async () => {
        // Given
        const bsda = await seedBsda();
        const bsdasri = await seedBsdasri();
        const bsdd = await seedBsdd();
        const bsff = await seedBsff();
        const bspaoh = await seedBspaoh();
        const bsvhu = await seedBsvhu();
        await reindex();

        // Manually update BSDs to add false revision fields
        await changeRevisionUpdatedAtAndRevisionTab(bsda.id, ONE_MONTH_AGO, [
          bsda.emitterCompanySiret!
        ]);
        await changeRevisionUpdatedAtAndRevisionTab(bsdasri.id, TODAY, [
          bsdasri.emitterCompanySiret!
        ]);
        await changeRevisionUpdatedAtAndRevisionTab(bsdd.id, TODAY, [
          bsdd.emitterCompanySiret!
        ]);
        await changeRevisionUpdatedAtAndRevisionTab(bsff.id, ONE_MONTH_AGO, [
          bsff.emitterCompanySiret!
        ]);
        await changeRevisionUpdatedAtAndRevisionTab(
          bspaoh.id,
          THREE_MONTHS_AGO,
          [bspaoh.emitterCompanySiret!]
        );
        await changeRevisionUpdatedAtAndRevisionTab(
          bsvhu.id,
          THREE_MONTHS_AGO,
          [bsvhu.emitterCompanySiret!]
        );

        // BSDs should all have revision data
        const bsds = await getESBsds();
        expect(bsds.length).toEqual(6);
        expect(
          bsds.find(b => !isDefined(b.nonPendingLatestRevisionRequestUpdatedAt))
        ).toBeUndefined();
        expect(bsds.find(b => !b.isReviewedRevisionFor.length)).toBeUndefined();

        // Given
        const body = await cleanUpIsReviewedRevisionForTab(testIndex.alias);

        // BSDs should not have disappeared
        expect(body.updated).toEqual(0);

        // BSDs should all have revision data
        const updatedBsds = await getESBsds();
        expect(updatedBsds.length).toEqual(6);
        expect(
          updatedBsds.find(
            b => !isDefined(b.nonPendingLatestRevisionRequestUpdatedAt)
          )
        ).toBeUndefined();
        expect(
          updatedBsds.find(b => !b.isReviewedRevisionFor.length)
        ).toBeUndefined();
      });
    });
  });
});
