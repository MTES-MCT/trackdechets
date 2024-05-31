import { ApiResponse, estypes } from "@elastic/elasticsearch";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../integration-tests/helper";
import { bsdaFactory } from "../../../bsda/__tests__/factories";
import { bsdasriFactory } from "../../../bsdasris/__tests__/factories";
import { createBsff } from "../../../bsffs/__tests__/factories";
import { bsvhuFactory } from "../../../bsvhu/__tests__/factories.vhu";
import { BsdElastic, client, index } from "../../../common/elastic";
import { formFactory, userFactory } from "../../../__tests__/factories";
import {
  getBsdIdentifiers,
  indexAllBsds,
  indexAllBsdTypeConcurrentJobs,
  indexAllBsdTypeSync,
  processDbIdentifiersByChunk
} from "../bulkIndexBsds";

type SearchResponse<Doc> = estypes.SearchResponse<Doc>;

describe("processDbIdentifiersByChunk", () => {
  it("should process every chunk", async () => {
    const ids = ["1", "2", "3", "4", "5"];
    const fn = jest.fn();
    await processDbIdentifiersByChunk(ids, fn, 2);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, ["1", "2"]);
    expect(fn).toHaveBeenNthCalledWith(2, ["3", "4"]);
    expect(fn).toHaveBeenNthCalledWith(3, ["5"]);
  });
});

describe("getBsdIdentifiers", () => {
  afterEach(resetDatabase);

  it.each([1, 2, 3, 4, 5, 100])(
    "should return all BSDD's identifiers when paginating by %p",
    async paginateBy => {
      const user = await userFactory();

      const form1 = await formFactory({ ownerId: user.id });
      const form2 = await formFactory({ ownerId: user.id });
      const form3 = await formFactory({ ownerId: user.id });
      const form4 = await formFactory({ ownerId: user.id });
      const form5 = await formFactory({ ownerId: user.id });

      const ids = await getBsdIdentifiers("bsdd", { paginateBy });
      expect(ids).toEqual([form1.id, form2.id, form3.id, form4.id, form5.id]);
    }
  );

  it.each([1, 2, 3, 4, 5, 100])(
    "should return all BSDA's identifiers when paginating by %p",
    async paginateBy => {
      const bsda1 = await bsdaFactory({});
      const bsda2 = await bsdaFactory({});
      const bsda3 = await bsdaFactory({});
      const bsda4 = await bsdaFactory({});
      const bsda5 = await bsdaFactory({});

      const ids = await getBsdIdentifiers("bsda", { paginateBy });
      expect(ids).toEqual([bsda1.id, bsda2.id, bsda3.id, bsda4.id, bsda5.id]);
    }
  );

  it.each([1, 2, 3, 4, 5, 100])(
    "should return all BSDASRI's identifiers when paginating by %p",
    async paginateBy => {
      const bsdasri1 = await bsdasriFactory({});
      const bsdasri2 = await bsdasriFactory({});
      const bsdasri3 = await bsdasriFactory({});
      const bsdasri4 = await bsdasriFactory({});
      const bsdasri5 = await bsdasriFactory({});

      const ids = await getBsdIdentifiers("bsdasri", { paginateBy });
      expect(ids).toEqual([
        bsdasri1.id,
        bsdasri2.id,
        bsdasri3.id,
        bsdasri4.id,
        bsdasri5.id
      ]);
    }
  );

  it.each([1, 2, 3, 4, 5, 100])(
    "should return all BSFF's identifiers when paginating by %p",
    async paginateBy => {
      const bsff1 = await createBsff();
      const bsff2 = await createBsff();
      const bsff3 = await createBsff();
      const bsff4 = await createBsff();
      const bsff5 = await createBsff();

      const ids = await getBsdIdentifiers("bsff", { paginateBy });
      expect(ids).toEqual([bsff1.id, bsff2.id, bsff3.id, bsff4.id, bsff5.id]);
    }
  );

  it.each([1, 2, 3, 4, 5, 100])(
    "should return all BSVHU's identifiers when paginating by %p",
    async paginateBy => {
      const bsvhu1 = await bsvhuFactory({});
      const bsvhu2 = await bsvhuFactory({});
      const bsvhu3 = await bsvhuFactory({});
      const bsvhu4 = await bsvhuFactory({});
      const bsvhu5 = await bsvhuFactory({});

      const ids = await getBsdIdentifiers("bsvhu", { paginateBy });
      expect(ids).toEqual([
        bsvhu1.id,
        bsvhu2.id,
        bsvhu3.id,
        bsvhu4.id,
        bsvhu5.id
      ]);
    }
  );

  it("should not return identifiers updated before since paramater", async () => {
    const user = await userFactory();

    // should not be returned
    await formFactory({
      ownerId: user.id,
      opt: { updatedAt: new Date("2023-01-01") }
    });
    const form2 = await formFactory({
      ownerId: user.id,
      opt: { updatedAt: new Date("2023-02-01") }
    });
    const ids = await getBsdIdentifiers("bsdd", {
      since: new Date("2023-02-01")
    });
    expect(ids).toEqual([form2.id]);
  });
});

describe("indexAllBsdTypeSync", () => {
  afterEach(resetDatabase);

  it("should index BSDDs synchronously", async () => {
    const user = await userFactory();
    const bsdds = await Promise.all([
      formFactory({ ownerId: user.id }),
      formFactory({ ownerId: user.id }),
      formFactory({ ownerId: user.id })
    ]);

    await indexAllBsdTypeSync({
      bsdName: "bsdd",
      index: index.alias,
      indexConfig: index
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
    expect(hits).toHaveLength(bsdds.length);
    for (const hit of hits) {
      expect(bsdds.map(bsdd => bsdd.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSDAs synchronously", async () => {
    const bsdas = await Promise.all([
      bsdaFactory({}),
      bsdaFactory({}),
      bsdaFactory({})
    ]);

    await indexAllBsdTypeSync({
      bsdName: "bsda",
      index: index.alias,
      indexConfig: index
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
    expect(hits).toHaveLength(bsdas.length);
    for (const hit of hits) {
      expect(bsdas.map(bsda => bsda.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSDASRIs synchronously", async () => {
    const bsdasris = await Promise.all([
      bsdasriFactory({}),
      bsdasriFactory({}),
      bsdasriFactory({})
    ]);

    await indexAllBsdTypeSync({
      bsdName: "bsdasri",
      index: index.alias,
      indexConfig: index
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
    expect(hits).toHaveLength(bsdasris.length);
    for (const hit of hits) {
      expect(bsdasris.map(bsdasri => bsdasri.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSFFs synchronously", async () => {
    const bsffs = await Promise.all([
      createBsff({}),
      createBsff({}),
      createBsff({})
    ]);

    await indexAllBsdTypeSync({
      bsdName: "bsff",
      index: index.alias,
      indexConfig: index
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
    expect(hits).toHaveLength(bsffs.length);
    for (const hit of hits) {
      expect(bsffs.map(bsff => bsff.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSVHUs synchronously", async () => {
    const bsvhus = await Promise.all([
      bsvhuFactory({}),
      bsvhuFactory({}),
      bsvhuFactory({})
    ]);
    await indexAllBsdTypeSync({
      bsdName: "bsvhu",
      index: index.alias,
      indexConfig: index
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
    expect(hits).toHaveLength(bsvhus.length);
    for (const hit of hits) {
      expect(bsvhus.map(bsvhu => bsvhu.id)).toContain(hit._source!.id);
    }
  });
});

describe("indexAllBsdTypeConcurrently", () => {
  afterEach(resetDatabase);

  it("should index BSDDs using the index queue", async () => {
    const user = await userFactory();
    const bsdds = await Promise.all([
      formFactory({ ownerId: user.id }),
      formFactory({ ownerId: user.id }),
      formFactory({ ownerId: user.id })
    ]);

    const jobs = await indexAllBsdTypeConcurrentJobs({
      bsdName: "bsdd",
      index: index.alias,
      indexConfig: index
    });
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    expect(jobs!.length).toEqual(1);
    expect(jobs![0].status).toEqual("fulfilled");
    const hits = body.hits.hits;
    expect(hits).toHaveLength(bsdds.length);
    for (const hit of hits) {
      expect(bsdds.map(bsdd => bsdd.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSDAs using the index queue", async () => {
    const bsdas = await Promise.all([
      bsdaFactory({}),
      bsdaFactory({}),
      bsdaFactory({})
    ]);

    const jobs = await indexAllBsdTypeConcurrentJobs({
      bsdName: "bsda",
      index: index.alias,
      indexConfig: index
    });
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    expect(jobs!.length).toEqual(1);
    expect(jobs![0].status).toEqual("fulfilled");
    const hits = body.hits.hits;
    expect(hits).toHaveLength(bsdas.length);
    for (const hit of hits) {
      expect(bsdas.map(bsda => bsda.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSDASRIs using the index queue", async () => {
    const bsdasris = await Promise.all([
      bsdasriFactory({}),
      bsdasriFactory({}),
      bsdasriFactory({})
    ]);

    const jobs = await indexAllBsdTypeConcurrentJobs({
      bsdName: "bsdasri",
      index: index.alias,
      indexConfig: index
    });
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    expect(jobs!.length).toEqual(1);
    expect(jobs![0].status).toEqual("fulfilled");
    const hits = body.hits.hits;
    expect(hits).toHaveLength(bsdasris.length);
    for (const hit of hits) {
      expect(bsdasris.map(bsdasri => bsdasri.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSFFs using the index queue", async () => {
    const bsffs = await Promise.all([
      createBsff({}),
      createBsff({}),
      createBsff({})
    ]);

    const jobs = await indexAllBsdTypeConcurrentJobs({
      bsdName: "bsff",
      index: index.alias,
      indexConfig: index
    });
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    expect(jobs!.length).toEqual(1);
    expect(jobs![0].status).toEqual("fulfilled");
    const hits = body.hits.hits;
    expect(hits).toHaveLength(bsffs.length);
    for (const hit of hits) {
      expect(bsffs.map(bsff => bsff.id)).toContain(hit._source!.id);
    }
  });

  it("should index BSVHUs using the index queue", async () => {
    const bsvhus = await Promise.all([
      bsvhuFactory({}),
      bsvhuFactory({}),
      bsvhuFactory({})
    ]);
    const jobs = await indexAllBsdTypeConcurrentJobs({
      bsdName: "bsvhu",
      index: index.alias,
      indexConfig: index
    });
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    expect(jobs!.length).toEqual(1);
    expect(jobs![0].status).toEqual("fulfilled");
    const hits = body.hits.hits;
    expect(hits).toHaveLength(bsvhus.length);
    for (const hit of hits) {
      expect(bsvhus.map(bsvhu => bsvhu.id)).toContain(hit._source!.id);
    }
  });
});

describe("indexAllBsds", () => {
  afterEach(resetDatabase);

  it("should index all BSDs synchronously", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const bsda = await bsdaFactory({});
    const bsdasri = await bsdasriFactory({});
    const bsff = await createBsff({});
    const bsvhu = await bsvhuFactory({});
    const bsds = [form, bsda, bsdasri, bsff, bsvhu];

    await indexAllBsds(index.alias, index, false);
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    const hits = body.hits.hits;

    expect(hits).toHaveLength(bsds.length);
    for (const hit of hits) {
      expect(bsds.map(bsd => bsd.id)).toContain(hit._source!.id);
    }
  });

  it("should index all BSDs in index queue", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const bsda = await bsdaFactory({});
    const bsdasri = await bsdasriFactory({});
    const bsff = await createBsff({});
    const bsvhu = await bsvhuFactory({});
    const bsds = [form, bsda, bsdasri, bsff, bsvhu];

    await indexAllBsds(index.alias, index, true);
    await refreshElasticSearch();

    const { body }: ApiResponse<SearchResponse<BsdElastic>> =
      await client.search({
        index: index.alias,
        body: {
          query: { match_all: {} }
        }
      });
    const hits = body.hits.hits;

    expect(hits).toHaveLength(bsds.length);
    for (const hit of hits) {
      expect(bsds.map(bsd => bsd.id)).toContain(hit._source!.id);
    }
  });
});
