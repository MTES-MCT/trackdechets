import { Status, WasteAcceptationStatus } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { formFactory, userFactory } from "../../__tests__/factories";
import {
  BsdIndexationConfig,
  client,
  index as globalIndex
} from "../../common/elastic";
import { reindexAllBsdsInBulk } from "../../bsds/indexation";
import { cleanUpIsReturnForTab } from "../elasticHelpers";
import { xDaysAgo } from "../../utils";

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

    it("should not remove fresh BSDs", async () => {
      // Given
      const user = await userFactory();
      await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.RECEIVED,
          receivedAt: new Date(),
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED
        }
      });
      await reindexAllBsdsInBulk({ index: testIndex });
      await client.indices.refresh({
        index: testIndex.alias
      });

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
      const user = await userFactory();
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.RECEIVED,
          receivedAt: new Date(),
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED
        }
      });
      await reindexAllBsdsInBulk({ index: testIndex });
      await client.indices.refresh({
        index: testIndex.alias
      });

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

      // BSDD should have disappeared
      const count2 = await countIsReturnForBSDs();
      expect(count2).toEqual(0);
    });

    it("should not touch unconcerned BSDs", async () => {
      // Given
      const user = await userFactory();
      // Shall go to isReturnFor tab
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.RECEIVED,
          receivedAt: new Date(),
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED
        }
      });
      // Shall NOT go to isReturnFor tab
      await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.RECEIVED,
          receivedAt: new Date(),
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED
        }
      });
      await reindexAllBsdsInBulk({ index: testIndex });
      await client.indices.refresh({
        index: testIndex.alias
      });

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

      // BSDD should have disappeared
      expect(body.updated).toEqual(1);
    });
  });
});
