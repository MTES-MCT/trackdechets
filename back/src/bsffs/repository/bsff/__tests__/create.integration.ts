import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth/auth";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getBsffRepository } from "../..";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { ApiResponse, estypes } from "@elastic/elasticsearch";
import { client, BsdElastic, index } from "../../../../common/elastic";
import { getStream } from "../../../../activity-events";

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
    const events = await getStream(bsff.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: bsff.id,
      type: "BsffCreated",
      data: { id: bsff.id, wasteDescription: "HFC" },
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    const { body }: ApiResponse<estypes.SearchResponse<BsdElastic>> =
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
