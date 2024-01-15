import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth";
import { prisma } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getBsffRepository } from "../..";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { ApiResponse, estypes } from "@elastic/elasticsearch";
import {
  client,
  BsdElastic,
  index,
  indexBsd
} from "../../../../common/elastic";
import { toBsdElastic } from "../../../elastic";
import { getStream } from "../../../../activity-events";

describe("bsffRepository.update", () => {
  afterEach(resetDatabase);

  it("should update record in DB, create event, and update index", async () => {
    async function searchByWasteCode(wasteCode: string) {
      const { body }: ApiResponse<estypes.SearchResponse<BsdElastic>> =
        await client.search({
          index: index.alias,
          body: {
            query: { term: { wasteCode: wasteCode } }
          }
        });
      return body.hits.hits;
    }

    const user = await userFactory();

    const bsff = await prisma.bsff.create({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteCode: "14 06 01*" },
      include: { packagings: true, ficheInterventions: true }
    });

    await indexBsd(toBsdElastic(bsff));
    await refreshElasticSearch();

    expect(await searchByWasteCode("14 06 01*")).toHaveLength(1);

    const { update: updateBsff } = getBsffRepository({
      ...user,
      auth: AuthType.Session
    });

    await updateBsff({
      where: { id: bsff.id },
      data: { wasteCode: "14 06 02*" }
    });

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });
    expect(updatedBsff.wasteCode).toEqual("14 06 02*");

    const events = await getStream(updatedBsff.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: bsff.id,
      type: "BsffUpdated",
      data: { wasteCode: "14 06 02*" },
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    expect(await searchByWasteCode("14 06 01*")).toHaveLength(0);
    expect(await searchByWasteCode("14 06 02*")).toHaveLength(1);
  });
});
