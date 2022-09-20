import { resetDatabase } from "../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../__tests__/factories";
import {
  indexElasticSearch,
  INDEX_ALIAS_NAME_SEPARATOR
} from "../indexElasticSearch.helpers";
import {
  BsdIndex,
  client,
  index as globalIndex
} from "../../../common/elastic";

describe("indexElasticSearch script", () => {
  const testAlias = "test_bsds";

  const testIndex: BsdIndex = {
    ...globalIndex,
    alias: testAlias
  };

  const testIndexV0: BsdIndex = {
    ...globalIndex,
    alias: testAlias
  };

  async function deleteTestIndexes() {
    await client.indices.delete({ index: "*" }, { ignore: [404] });
  }

  afterEach(async () => {
    await resetDatabase();
    await deleteTestIndexes();
  });

  it("should initialize an index and alias from scratch", async () => {
    await indexElasticSearch({ index: testIndex });
    const catAliasResponses = await client.cat.aliases({
      name: testIndex.alias,
      format: "json"
    });
    expect(catAliasResponses.body).toHaveLength(1);
    const { alias, index: aliasedIndex } = catAliasResponses.body[0];
    expect(alias).toEqual(testIndex.alias);
    expect(aliasedIndex).toEqual(testIndex.alias);
  });

  it("should not do anything when index and alias already exist and mapping is not changed", async () => {
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

    // create a new form an index again
    await formFactory({ ownerId: user.id });
    await indexElasticSearch({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse2 = await client.count({ index: testIndex.alias });

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

  it("should reindex documents when the index mapping is changed", async () => {
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
    const { alias } = catAliasResponses.body[0];
    expect(alias).toEqual(testIndex.alias);

    // check all documents have been reindexed
    const countResponse2 = await client.count({ index: testIndex.alias });
    expect(countResponse2.body.count).toEqual(2);

    // check there is 2 indices left
    const leftIndices = await client.indices.get({
      index: `${testIndex.alias}${INDEX_ALIAS_NAME_SEPARATOR}*`
    });
    expect(leftIndices.body).toEqual(2);
  });
});
