import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { BsdType } from "../../generated/graphql/types";
import { BsdElastic, client, index, indexBsds } from "../elastic";

describe("readableId analyzer", () => {
  beforeAll(async () => {
    const defaultOpts = {
      emitter: "emitter",
      recipient: "recipient",
      waste: "01 01 01",
      createdAt: new Date().getMilliseconds(),
      isDraftFor: [],
      isForActionFor: [],
      isFollowFor: [],
      isArchivedFor: [],
      isToCollectFor: [],
      isCollectedFor: [],
      sirets: []
    };

    const bsds: BsdElastic[] = [
      {
        id: "BSD-20211004-KU76G98FRT",
        type: "BSDD" as BsdType
      },
      {
        id: "BSD-20211005-JUGTDR876",
        type: "BSDD" as BsdType
      },
      {
        id: "VHU-20210101-8J4D0HY57",
        type: "BSVHU" as BsdType
      }
    ].map(({ id, type }) => ({ id, readableId: id, type, ...defaultOpts }));

    await indexBsds(index.alias, bsds);
    await refreshElasticSearch();
  });

  afterAll(resetDatabase);

  test("exact match", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "BSD-20211004-KU76G98FRT",
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FRT");
  });

  test("partial match", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "BSD-20211004",
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FRT");
  });

  test("search by substring in bsd type component", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "BS"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const matches = hits.map(hit => hit._source.readableId);
    expect(matches).toContain("BSD-20211004-KU76G98FRT");
    expect(matches).toContain("BSD-20211005-JUGTDR876");
  });

  test("search by substring in date component", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "1004",
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FRT");
  });

  test("search by substring in random id component", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "6G9"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FRT");
  });
});
