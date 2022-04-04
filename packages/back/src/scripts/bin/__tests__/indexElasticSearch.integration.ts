import { resetDatabase } from "../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../__tests__/factories";
import { indexElasticSearch } from "../indexElasticSearch.helpers";
import {
  BsdIndex,
  client,
  index as globalIndex
} from "../../../common/elastic";

describe("indexElasticSearch script", () => {
  const testAlias = "test_bsds";

  const testIndex: BsdIndex = {
    ...globalIndex,
    alias: testAlias,
    index: "test_bsds_v1"
  };

  const testIndexV0: BsdIndex = {
    ...globalIndex,
    alias: testAlias,
    index: "test_bsds_v0.1"
  };

  async function deleteTestIndexes() {
    for (const idx of [testIndex.index, testIndexV0.index]) {
      await client.indices.delete({ index: [idx] }, { ignore: [404] });
    }
  }

  afterEach(async () => {
    await resetDatabase();
    await deleteTestIndexes();
  });

  it("should create index and alias from scratch", async () => {
    await indexElasticSearch({ index: testIndex });
    const catAliasResponses = await client.cat.aliases({
      name: testIndex.alias,
      format: "json"
    });
    expect(catAliasResponses.body).toHaveLength(1);
    const { alias, index: aliasedIndex } = catAliasResponses.body[0];
    expect(alias).toEqual(testIndex.alias);
    expect(aliasedIndex).toEqual(testIndex.index);
  });

  it("should not do anything when index and alias already exist and index version is not bumped", async () => {
    const user = await userFactory();
    await formFactory({ ownerId: user.id });

    // initialize index and alias
    await indexElasticSearch({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse1 = await client.count({ index: testIndex.index });

    // check the first form has been indexed
    expect(countResponse1.body.count).toEqual(1);

    // create a new form an index again
    await formFactory({ ownerId: user.id });
    await indexElasticSearch({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse2 = await client.count({ index: testIndex.index });

    // check the second form has not been indexed
    expect(countResponse2.body.count).toEqual(1);
  });

  it("should force reindex in place when force=true", async () => {
    const user = await userFactory();
    await formFactory({ ownerId: user.id });

    // initialize index and alias
    await indexElasticSearch({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse1 = await client.count({ index: testIndex.alias });

    // check the first form has been indexed
    expect(countResponse1.body.count).toEqual(1);

    // create a new form an index again with force=true
    await formFactory({ ownerId: user.id });
    await indexElasticSearch({ index: testIndex, force: true });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse2 = await client.count({ index: testIndex.alias });

    // check the second form has been indexed
    expect(countResponse2.body.count).toEqual(2);
  });

  it("should reindex documents when the index version is bumped", async () => {
    // initialize index and alias with an old version
    const user = await userFactory();
    await formFactory({ ownerId: user.id });

    await indexElasticSearch({
      index: testIndexV0
    });
    await client.indices.refresh({
      index: testIndexV0.alias
    });
    const countResponse1 = await client.count({ index: testIndexV0.alias });
    // check the first form is indexed
    expect(countResponse1.body.count).toEqual(1);
    await formFactory({ ownerId: user.id });
    // bump version and reindex
    await indexElasticSearch({
      index: testIndex
    });
    await client.indices.refresh({
      index: testIndex.alias
    });

    const catAliasResponses = await client.cat.aliases({
      name: testIndex.alias,
      format: "json"
    });

    expect(catAliasResponses.body).toHaveLength(1);
    const { alias, index: aliasedIndex } = catAliasResponses.body[0];
    expect(alias).toEqual(testIndex.alias);
    // check alias point to new index
    expect(aliasedIndex).toEqual(testIndex.index);

    // check all documents have been reindexed
    const countResponse2 = await client.count({ index: testIndex.alias });
    expect(countResponse2.body.count).toEqual(2);

    // check old index does not exist anymore
    const shouldThrow = () => client.indices.get({ index: testIndexV0.index });
    await expect(shouldThrow()).rejects.toThrowError(
      "index_not_found_exception: [index_not_found_exception] Reason: no such index"
    );
  });
});
