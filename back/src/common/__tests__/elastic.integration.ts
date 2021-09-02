import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
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
        readableId: "BSD-20211004-KU76G98FRT",
        type: "BSDD",
        ...defaultOpts
      },
      {
        id: "VHU-20210101-8J4D0HY57",
        readableId: "VHU-20210101-8J4D0HY57",
        type: "BSVHU",
        ...defaultOpts
      }
    ];
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

  test("search by substring in bsd type component", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "VH"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("VHU-20210101-8J4D0HY57");
  });

  test("search by substring date component", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            readableId: {
              query: "1004"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FRT");
  });

  test("search by substring in random date component", async () => {
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
