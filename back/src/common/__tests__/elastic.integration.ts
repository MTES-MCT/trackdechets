import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { BsdType } from "../../generated/graphql/types";
import { BsdElastic, client, index, indexBsds } from "../elastic";
import getReadableId from "../../forms/readableId";

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
        id: "BSD-20211004-KU76G98FR",
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
              query: "BSD-20211004-KU76G98FR",
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FR");
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
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FR");
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
    expect(matches).toContain("BSD-20211004-KU76G98FR");
    expect(matches).toContain("BSD-20211005-JUGTDR876");
  });

  test("search by substring in date component", async () => {
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
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FR");
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
    expect(hits[0]._source.readableId).toEqual("BSD-20211004-KU76G98FR");
  });
});

describe("waste.ngram analyzer", () => {
  const waste1 = "01 01 01 minéraux";
  const waste2 = "02 01 08* déchets agro";
  const waste3 = "10 01 05* désulfuration gaz";

  beforeAll(async () => {
    const defaultOpts = {
      type: "BSDD" as BsdType,
      emitter: "emitter",
      recipient: "recipient",
      createdAt: new Date().getMilliseconds(),
      isDraftFor: [],
      isForActionFor: [],
      isFollowFor: [],
      isArchivedFor: [],
      isToCollectFor: [],
      isCollectedFor: [],
      sirets: []
    };

    const bsds: BsdElastic[] = [waste1, waste2, waste3].map(waste => {
      const id = getReadableId();
      return {
        id,
        readableId: id,
        waste,
        ...defaultOpts
      };
    });

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
            "waste.ngram": {
              query: "01 01 01"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.waste).toEqual(waste1);
  });

  test("partial match", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            "waste.ngram": {
              query: "01"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(3);
    const matches = hits.map(hit => hit._source.waste);
    expect(matches).toContain(waste1);
    expect(matches).toContain(waste2);
    expect(matches).toContain(waste3);
  });

  test("dangerous only", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            "waste.ngram": {
              query: "*"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const matches = hits.map(hit => hit._source.waste);
    expect(matches).toContain(waste2);
    expect(matches).toContain(waste3);
  });
});

describe("waste text analyzer", () => {
  const waste1 = "01 01 01 minéraux";
  const waste2 = "02 01 08* déchets agro";
  const waste3 = "10 01 05* désulfuration gaz";

  beforeAll(async () => {
    const defaultOpts = {
      type: "BSDD" as BsdType,
      emitter: "emitter",
      recipient: "recipient",
      createdAt: new Date().getMilliseconds(),
      isDraftFor: [],
      isForActionFor: [],
      isFollowFor: [],
      isArchivedFor: [],
      isToCollectFor: [],
      isCollectedFor: [],
      sirets: []
    };

    const bsds: BsdElastic[] = [waste1, waste2, waste3].map(waste => {
      const id = getReadableId();
      return {
        id,
        readableId: id,
        waste,
        ...defaultOpts
      };
    });

    await indexBsds(index.alias, bsds);
    await refreshElasticSearch();
  });

  afterAll(resetDatabase);

  test("full text search", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            waste: {
              query: "désulfuration"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.waste).toEqual(waste3);
  });

  it("should discard digits", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            waste: {
              query: "01"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });
});

describe("transporterNumberPlate analyzer", () => {
  const plates = ["GT-086-HY", "GT-022-VC", "AD-022-DA"];

  beforeAll(async () => {
    const defaultOpts = {
      type: "BSDD" as BsdType,
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

    const bsds: BsdElastic[] = plates.map(plate => {
      const id = getReadableId();
      return {
        id,
        readableId: id,
        transporterNumberPlate: [plate],
        ...defaultOpts
      };
    });

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
            transporterNumberPlate: {
              query: plates[0],
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.transporterNumberPlate).toEqual([plates[0]]);
  });

  test("lower case match", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            transporterNumberPlate: {
              query: plates[0].toLowerCase(),
              operator: "and"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.transporterNumberPlate).toEqual([plates[0]]);
  });

  test("partial match ", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            transporterNumberPlate: {
              query: "GT"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const expected = new Set([plates[0], plates[1]]); // GT-* plates expected

    expect(expected).toEqual(
      new Set(hits.flatMap(h => h._source.transporterNumberPlate))
    );
  });
});
