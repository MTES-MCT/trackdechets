import {
  BsdasriStatus,
  BsdaStatus,
  BsffStatus,
  BspaohStatus,
  BsvhuStatus,
  Status,
  WasteAcceptationStatus
} from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyFactory,
  formFactory,
  userFactory
} from "../../__tests__/factories";
import {
  BsdIndexationConfig,
  client,
  index as globalIndex
} from "../../common/elastic";
import { reindexAllBsdsInBulk } from "../../bsds/indexation";
import { cleanUpIsReturnForTab } from "../elasticHelpers";
import { xDaysAgo } from "../../utils";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { createBsff } from "../../bsffs/__tests__/factories";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { bspaohFactory } from "../../bspaoh/__tests__/factories";

describe("elasticHelpers", () => {
  describe("cleanUpIsReturnForTab", () => {
    // do not use INDEX_ALIAS_NAME_SEPARATOR
    const testAlias = "testbsds";

    const testIndex: BsdIndexationConfig = {
      ...globalIndex,
      alias: testAlias
    };

    async function deleteTestIndexes() {
      await client.indices.delete(
        { index: `${testAlias}*` },
        { ignore: [404] }
      );
    }

    afterEach(async () => {
      await resetDatabase();
      await deleteTestIndexes();
    });

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
      const bsff = await createBsff(
        {},
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
      const bsdasri = await bsdasriFactory({
        opt: {
          status: BsdasriStatus.RECEIVED,
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
          transporterCompanySiret: transporter.siret
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
});
