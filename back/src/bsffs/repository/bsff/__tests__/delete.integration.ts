import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth/auth";
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

describe("bsffRepository.delete", () => {
  afterEach(resetDatabase);

  it("should soft delete BSFF, create event and delete document in Elasticsearch", async () => {
    async function searchBsds() {
      const { body }: ApiResponse<estypes.SearchResponse<BsdElastic>> =
        await client.search({
          index: index.alias,
          body: {
            query: { match_all: {} }
          }
        });
      return body.hits.hits;
    }

    const user = await userFactory();

    const bsff = await prisma.bsff.create({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteCode: "14 06 01*" },
      include: {
        packagings: true,
        ficheInterventions: true,
        transporters: true
      }
    });

    await indexBsd(toBsdElastic(bsff));
    await refreshElasticSearch();

    const hits = await searchBsds();
    expect(hits).toHaveLength(1);
    expect(hits[0]._id).toEqual(bsff.id);

    const { delete: deleteBsff } = getBsffRepository({
      ...user,
      auth: AuthType.Session
    });

    await deleteBsff({ where: { id: bsff.id } });

    const deletedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });
    expect(deletedBsff.isDeleted).toBe(true);

    const events = await getStream(deletedBsff.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: bsff.id,
      type: "BsffDeleted",
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    expect(await searchBsds()).toHaveLength(0);
  });
});
