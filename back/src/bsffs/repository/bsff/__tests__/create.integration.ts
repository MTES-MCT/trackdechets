import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth";
import prisma from "../../../../prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getBsffRepository } from "../..";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { ApiResponse } from "@elastic/elasticsearch";
import { SearchResponse } from "@elastic/elasticsearch/api/types";
import { client, BsdElastic, index } from "../../../../common/elastic";

describe("bsffRepository.create", () => {
  afterEach(resetDatabase);

  it("should create event and index BSFF", async () => {
    const user = await userFactory();

    const { create: createBsff } = getBsffRepository({
      ...user,
      auth: AuthType.Session
    });
    const bsff = await createBsff({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteDescription: "HFC" }
    });
    const events = await prisma.event.findMany();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: bsff.id,
      type: "BsffCreated",
      data: { id: bsff.id, wasteDescription: "HFC" },
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    const hits = body.hits.hits;
    expect(hits).toHaveLength(1);
    expect(hits[0]._id).toEqual(bsff.id);
  });
});
