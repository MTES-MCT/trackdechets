import {
  resetDatabase,
  refreshElasticSearch
} from "../../../integration-tests/helper";
import {
  BsdElastic,
  client,
  index,
  indexBsds,
  transportPlateFilter
} from "../../common/elastic";
import { BsdWhere } from "../../generated/graphql/types";
import { toElasticQuery } from "../where";

describe("StringFilter to elastic query", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        readableId: "BSD-20230209-N84SXPCYV",
        emitterCompanySiret: "85001946400021"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        readableId: "BSD-20230209-3Q6T7SPC7",
        emitterCompanySiret: "79824982700014"
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
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
        updatedAt: new Date().getTime(),
        emitterCompanyName: "CODE EN STOCK"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        emitterCompanyName: "DÉCHETS & CO"
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should perform a full text match", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "déchets co" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("2");
  });

  it("should match on substring", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "co" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits.map(h => h._source.id)).toContain("1");
    expect(hits.map(h => h._source.id)).toContain("2");
  });

  it("should match on substring (bis)", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "cod" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not allow fuzzy search", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "CADE" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });

  it("should match if we provide several tokens in the search query", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "CODE EN STOCK" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(1);
    expect(hits[0]._source.id).toEqual("1");
  });

  it("should not be case sensitive", async () => {
    const textFilter: BsdWhere = {
      emitter: { company: { name: { _match: "code" } } }
    };

    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(textFilter)
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
        updatedAt: new Date().getTime(),
        transporterTransportPlates: ["AD-008-TS", "HY-987-DE", "JG-987-AQ"].map(
          transportPlateFilter
        )
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        transporterTransportPlates: ["JU-874-KL"].map(transportPlateFilter)
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
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

  it("should match plate without dash", async () => {
    const listFilter: BsdWhere = {
      transporter: { transport: { plates: { _has: "AD008TS" } } }
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
        createdAt: new Date("2023-01-01T15:00:00").getTime(),
        updatedAt: new Date().getTime()
      },
      {
        id: "2",
        createdAt: new Date("2023-01-02T23:00:00").getTime(),
        updatedAt: new Date().getTime()
      },
      {
        id: "3",
        createdAt: new Date("2023-01-03T09:00:00").getTime(),
        updatedAt: new Date().getTime()
      },
      {
        id: "4",
        createdAt: new Date("2023-01-04T11:30:30").getTime(),
        updatedAt: new Date().getTime()
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should match when _lte and _gte are equal", async () => {
    const dateFilter: BsdWhere = {
      createdAt: { _lte: new Date("2023-01-01"), _gte: new Date("2023-01-01") }
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
        updatedAt: new Date().getTime(),
        status: "SENT",
        wasteCode: "01 01 01"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        status: "ACCEPTED",
        wasteCode: "01 01 01"
      },
      {
        id: "3",
        updatedAt: new Date().getTime(),
        status: "SENT",
        wasteCode: "02 02 02"
      },
      {
        id: "4",
        updatedAt: new Date().getTime(),
        status: "PROCESSED",
        wasteCode: "03 03 03"
      },
      {
        id: "5",
        updatedAt: new Date().getTime(),
        status: "SENT",
        wasteCode: "04 04 04"
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
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
        updatedAt: new Date().getTime(),
        readableId: "BSD-20230209-N84SXPCYV"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        readableId: "BSD-20230209-3Q6T7SHE7"
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
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
        updatedAt: new Date().getTime(),
        wasteCode: "01 01 01*"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        readableId: "01 01 02"
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
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

describe("search on destinationCap", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        destinationCap: "CAP-1"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        destinationCap: "CAP-2"
      },
      {
        id: "3",
        updatedAt: new Date().getTime()
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should return exact match", async () => {
    const where: BsdWhere = {
      destination: { cap: { _match: "CAP-1" } }
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

  it("should return partial matches", async () => {
    const where: BsdWhere = {
      destination: { cap: { _match: "CAP-" } }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits[0]._source.id).toEqual("1");
    expect(hits[1]._source.id).toEqual("2");
  });
});

describe("search on transporterCompanyVatNumber", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        transporterCompanyVatNumber: "TRANS-COMP-VAT-1"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        transporterCompanyVatNumber: "TRANS-COMP-VAT-2"
      },
      {
        id: "3",
        updatedAt: new Date().getTime()
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should return exact match", async () => {
    const where: BsdWhere = {
      transporter: { company: { vatNumber: { _contains: "TRANS-COMP-VAT-1" } } }
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

  it("should return partial matches", async () => {
    const where: BsdWhere = {
      transporter: { company: { vatNumber: { _contains: "TRANS-COMP-VAT-" } } }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits[0]._source.id).toEqual("1");
    expect(hits[1]._source.id).toEqual("2");
  });
});

describe("search on nextDestinationCompanyVatNumber", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        nextDestinationCompanyVatNumber: "NEXT-DEST-VAT-1"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        nextDestinationCompanyVatNumber: "NEXT-DEST-VAT-2"
      },
      {
        id: "3",
        updatedAt: new Date().getTime()
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should return exact match", async () => {
    const where: BsdWhere = {
      destination: {
        operation: {
          nextDestination: {
            company: { vatNumber: { _contains: "NEXT-DEST-VAT-1" } }
          }
        }
      }
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

  it("should return partial matches", async () => {
    const where: BsdWhere = {
      destination: {
        operation: {
          nextDestination: {
            company: { vatNumber: { _contains: "NEXT-DEST-VAT-" } }
          }
        }
      }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    expect(hits[0]._source.id).toEqual("1");
    expect(hits[1]._source.id).toEqual("2");
  });
});

describe("search on companiesNames", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        companiesNames: "Foo\nBar"
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        companiesNames: "Foo"
      },
      {
        id: "3",
        updatedAt: new Date().getTime(),
        companiesNames: ""
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should return one result", async () => {
    const where: BsdWhere = {
      companiesNames: {
        _match: "Bar"
      }
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

  it("should return several results", async () => {
    const where: BsdWhere = {
      companiesNames: {
        _match: "Foo"
      }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const resultsIds = hits.map(h => h._source.id);
    expect(resultsIds).toContain("1");
    expect(resultsIds).toContain("2");
  });

  it("should return nothing", async () => {
    const where: BsdWhere = {
      companiesNames: {
        _match: "X"
      }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });
});

describe("search on companiesSirets", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    const bsds: Partial<BsdElastic>[] = [
      {
        id: "1",
        updatedAt: new Date().getTime(),
        companiesSirets: ["SIRET1", "SIRET2"]
      },
      {
        id: "2",
        updatedAt: new Date().getTime(),
        companiesSirets: ["SIRET1"]
      },
      {
        id: "3",
        updatedAt: new Date().getTime(),
        companiesSirets: []
      }
    ];

    await indexBsds(index.alias, bsds as any, index.elasticSearchUrl);
    await refreshElasticSearch();
  });

  it("should return one result", async () => {
    const where: BsdWhere = {
      companiesSirets: {
        _has: "SIRET2"
      }
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

  it("should return several results", async () => {
    const where: BsdWhere = {
      companiesSirets: {
        _has: "SIRET1"
      }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(2);
    const resultsIds = hits.map(h => h._source.id);
    expect(resultsIds).toContain("1");
    expect(resultsIds).toContain("2");
  });

  it("should return nothing", async () => {
    const where: BsdWhere = {
      companiesSirets: {
        _has: "SIRET3"
      }
    };
    const result = await client.search({
      index: index.alias,
      body: {
        query: toElasticQuery(where)
      }
    });

    const hits = result.body.hits.hits;

    expect(hits).toHaveLength(0);
  });
});
