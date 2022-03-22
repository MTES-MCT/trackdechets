import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import getReadableId from "../../forms/readableId";
import { BsdType } from "../../generated/graphql/types";
import { BsdElastic, client, index, indexBsds } from "../elastic";

const defaultOpts: BsdElastic = {
  id: "id",
  readableId: "readableId",
  customId: null,
  type: "BSDD" as BsdType,
  emitterCompanyName: "emitter name",
  emitterCompanySiret: "emitter siret",
  transporterCompanyName: "transporter name",
  transporterCompanySiret: "transporter siret",
  transporterTakenOverAt: null,
  wasteCode: "01 01 01",
  wasteDescription: "déchets",
  transporterNumberPlate: [],
  transporterCustomInfo: null,
  destinationCompanyName: "destination name",
  destinationCompanySiret: "destination siret",
  destinationReceptionDate: null,
  destinationReceptionWeight: null,
  destinationOperationCode: "D10",
  destinationOperationDate: null,
  createdAt: new Date().getMilliseconds(),
  isDraftFor: [],
  isForActionFor: [],
  isFollowFor: [],
  isArchivedFor: [],
  isToCollectFor: [],
  isCollectedFor: [],
  sirets: [],
  isIncomingWasteFor: [],
  isOutgoingWasteFor: [],
  isTransportedWasteFor: [],
  isManagedWasteFor: []
};

describe("readableId analyzer", () => {
  beforeAll(async () => {
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
    ].map(({ id, type }) => ({ ...defaultOpts, id, readableId: id, type }));

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
  const waste1 = "01 01 01";
  const waste2 = "02 01 08*";
  const waste3 = "10 01 05*";

  beforeAll(async () => {
    const bsds: BsdElastic[] = [waste1, waste2, waste3].map(wasteCode => {
      const id = getReadableId();
      return {
        ...defaultOpts,
        id,
        wasteCode
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
            "wasteCode.ngram": {
              query: "01 01 01"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.wasteCode).toEqual(waste1);
  });

  test("partial match", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            "wasteCode.ngram": {
              query: "01"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(3);
    const matches = hits.map(hit => hit._source.wasteCode);
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
            "wasteCode.ngram": {
              query: "*"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const matches = hits.map(hit => hit._source.wasteCode);
    expect(matches).toContain(waste2);
    expect(matches).toContain(waste3);
  });
});

describe("waste text analyzer", () => {
  const waste1 = "minéraux";
  const waste2 = "déchets agro";
  const waste3 = "désulfuration gaz";

  beforeAll(async () => {
    const bsds: BsdElastic[] = [waste1, waste2, waste3].map(waste => {
      const id = getReadableId();
      return {
        ...defaultOpts,
        id,
        wasteDescription: waste
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
            wasteDescription: {
              query: "désulfuration"
            }
          }
        }
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.wasteDescription).toEqual(waste3);
  });

  it("should discard digits", async () => {
    const result = await client.search({
      index: index.alias,
      body: {
        query: {
          match: {
            wasteDescription: {
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
    const bsds: BsdElastic[] = plates.map(plate => {
      const id = getReadableId();
      return {
        ...defaultOpts,
        id,
        transporterNumberPlate: [plate]
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
