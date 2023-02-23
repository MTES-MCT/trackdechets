import {
  resetDatabase,
  refreshElasticSearch
} from "../../../integration-tests/helper";
import { BsdElastic, client, index, indexBsds } from "../../common/elastic";
import { BsdWhere } from "../../generated/graphql/types";
import { toElasticQuery } from "../where";

describe("StringFilter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        readableId: "BSD-20230209-N84SXPCYV",
        emitterCompanySiret: "85001946400021"
      },
      {
        id: "2",
        readableId: "BSD-20230209-3Q6T7SPC7",
        emitterCompanySiret: "79824982700014"
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should perform an exact match with _eq", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _eq: "BSD-20230209-N84SXPCYV" }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  test("exact match should not be case sensitive", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _eq: "BSD-20230209-N84SXPCYV".toLowerCase() }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should match on substring with _contains", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _contains: "N84" }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not match on smaller ngram", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _contains: "PC7" }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("2");
  });

  test("_contains match should not be case sensitive", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _contains: "pc7" }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("2");
  });

  test("_contains match should work on long strings", async () => {
    const stringFilter: BsdWhere = {
      emitter: {
        company: { siret: { _contains: "798249827" } } // match on SIREN
      }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("2");
  });

  it("should match in list", async () => {
    const stringFilter: BsdWhere = {
      readableId: { _in: ["BSD-20230209-N84SXPCYV", "BSD-20230209-59HGWY5X8"] }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });
});

describe("TextFilter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        emitterCompanyName: "CODE EN STOCK"
      },
      {
        id: "2",
        emitterCompanyName: "DÉCHETS & CO"
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should perform a full text match", async () => {
    const stringFilter: BsdWhere = {
      emitter: { company: { name: { _match: "CODE" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not allow fuzzy search", async () => {
    const stringFilter: BsdWhere = {
      emitter: { company: { name: { _match: "CADE" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });

  it("should match if we provide several tokens in the search query", async () => {
    const stringFilter: BsdWhere = {
      emitter: { company: { name: { _match: "CODE EN STOCK" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not be case sensitive", async () => {
    const stringFilter: BsdWhere = {
      emitter: { company: { name: { _match: "code" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(stringFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });
});

describe("StringNullableFilter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        transporterTransportPlates: ["AD-008-TS", "HY-987-DE", "JG-987-AQ"]
      },
      {
        id: "2",
        transporterTransportPlates: ["JU-874-KL"]
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should match for _has when the value is present", async () => {
    const listFilter: BsdWhere = {
      transporter: { transport: { plates: { _has: "AD-008-TS" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not match for _has when the value is not present", async () => {
    const listFilter: BsdWhere = {
      transporter: { transport: { plates: { _has: "toto" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });

  it("should match for _hasEvery when all values are present", async () => {
    const listFilter: BsdWhere = {
      transporter: {
        transport: { plates: { _hasEvery: ["AD-008-TS", "HY-987-DE"] } }
      }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not match for _hasEvery when one value is not present", async () => {
    const listFilter: BsdWhere = {
      transporter: {
        transport: { plates: { _hasEvery: ["AD-008-TS", "toto"] } }
      }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });

  it("should match for _hasSome when at least one value is present", async () => {
    const listFilter: BsdWhere = {
      transporter: {
        transport: { plates: { _hasSome: ["AD-008-TS", "toto"] } }
      }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not match for _hasSome when no value is present", async () => {
    const listFilter: BsdWhere = {
      transporter: { transport: { plates: { _hasSome: ["titi", "toto"] } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });

  it("should match for _itemContains when one element contains the substring", async () => {
    const listFilter: BsdWhere = {
      transporter: { transport: { plates: { _itemContains: "AD" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(listFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });
});

describe("DateFilter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        createdAt: new Date("2023-01-01").getTime()
      },
      {
        id: "2",
        createdAt: new Date("2023-01-02").getTime()
      },
      {
        id: "3",
        createdAt: new Date("2023-01-03").getTime()
      },
      {
        id: "4",
        createdAt: new Date("2023-01-04").getTime()
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should match for _eq when value is equal", async () => {
    const dateFilter: BsdWhere = {
      createdAt: { _eq: new Date("2023-01-01") }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(dateFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should match between two dates with _lte and _gte", async () => {
    const dateFilter: BsdWhere = {
      createdAt: { _gte: new Date("2023-01-02"), _lte: new Date("2023-01-03") }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(dateFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits.map(h => h._source.id).sort()).toEqual(["2", "3"]);
  });

  it("should match between two dates with _lt and _gt", async () => {
    const dateFilter: BsdWhere = {
      createdAt: { _gt: new Date("2023-01-01"), _lt: new Date("2023-01-04") }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(dateFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits.map(h => h._source.id).sort()).toEqual(["2", "3"]);
  });
});

describe("Compound filter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        status: "SENT",
        wasteCode: "01 01 01"
      },
      {
        id: "2",
        status: "ACCEPTED",
        wasteCode: "01 01 01"
      },
      {
        id: "3",
        status: "SENT",
        wasteCode: "02 02 02"
      },
      {
        id: "4",
        status: "PROCESSED",
        wasteCode: "03 03 03"
      },
      {
        id: "5",
        status: "SENT",
        wasteCode: "04 04 04"
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should combine filters with an _and operator", async () => {
    const where: BsdWhere = {
      _and: [
        {
          status: { _eq: "SENT" }
        },
        { waste: { code: { _eq: "01 01 01" } } }
      ]
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should combine filters with an _or operator", async () => {
    const where: BsdWhere = {
      _or: [
        {
          waste: { code: { _eq: "01 01 01" } }
        },
        { waste: { code: { _eq: "03 03 03" } } }
      ]
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(3);
    expect(hits.map(h => h._source.id).sort()).toEqual(["1", "2", "4"]);
  });

  it("should be possible to nest _and and _or", async () => {
    const where: BsdWhere = {
      _or: [
        {
          _and: [
            { status: { _eq: "SENT" } },
            { waste: { code: { _eq: "01 01 01" } } }
          ]
        },
        {
          _and: [
            { status: { _eq: "PROCESSED" } },
            { waste: { code: { _eq: "03 03 03" } } }
          ]
        }
      ]
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits.map(h => h._source.id).sort()).toEqual(["1", "4"]);
  });

  it("should not be possible to nest _and and _or more than two levels deep", () => {
    const where: BsdWhere = {
      _or: [
        {
          _and: [{ _or: [{ waste: { code: { _eq: "02 02 02" } } }] }]
        }
      ]
    };
    expect(() => toElasticQuery(where)).toThrow(
      "Vous ne pouvez pas imbriquer des opérations _and et _or sur plus de 2 niveaux"
    );
  });

  it("should not be possible to combine _or and _and at the same level", async () => {
    const where: BsdWhere = {
      _or: [
        {
          waste: { code: { _eq: "01 01 01" } }
        }
      ],
      _and: [
        {
          waste: { code: { _eq: "02 02 02" } }
        }
      ]
    };
    expect(() => toElasticQuery(where)).toThrow(
      "Vous ne pouvez pas construire un filtre avec `_and` et `_or` au même niveau"
    );
  });

  it("should not be possible to combine _or with top level filter", async () => {
    const where: BsdWhere = {
      status: { _eq: "SENT" },
      _or: [
        {
          waste: { code: { _eq: "01 01 01" } }
        }
      ]
    };
    expect(() => toElasticQuery(where)).toThrow(
      "Vous ne pouvez pas construire un filtre avec des champs au même niveau que `_or`"
    );
  });

  it("should be possible to combine _and with top level filter", async () => {
    const where: BsdWhere = {
      status: { _eq: "SENT" },
      _and: [
        {
          waste: { code: { _eq: "01 01 01" } }
        }
      ]
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits.map(h => h._source.id).sort()).toEqual(["1"]);
  });

  test("empty _and filter should match everything", async () => {
    const where: BsdWhere = {
      _and: []
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });
    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(5);
  });
});

describe("search on readableId", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        readableId: "BSD-20230209-N84SXPCYV"
      },
      {
        id: "2",
        readableId: "BSD-20230209-3Q6T7SHE7"
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should match if we match substring on different parts of the id", async () => {
    const where: BsdWhere = {
      readableId: { _contains: "BS 4SXPCY" }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });
});

describe("search on wasteCode", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        wasteCode: "01 01 01*"
      },
      {
        id: "2",
        readableId: "01 01 02"
      }
    ];

    await indexBsds(index.alias, bsds as any);
    await refreshElasticSearch();
  });

  it("should match on *", async () => {
    const where: BsdWhere = {
      waste: { code: { _contains: "*" } }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });
});
