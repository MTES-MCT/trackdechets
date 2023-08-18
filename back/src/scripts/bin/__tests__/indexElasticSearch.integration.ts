import { resetDatabase } from "../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../__tests__/factories";
import { INDEX_ALIAS_NAME_SEPARATOR } from "../../../bsds/indexation/bulkIndexBsds";
import { reindexAllBsdsInBulk } from "../../../bsds/indexation";
import {
  BsdIndexationConfig,
  client,
  index as globalIndex
} from "../../../common/elastic";

describe("reindexAllBsdsInBulk script", () => {
  // do not use INDEX_ALIAS_NAME_SEPARATOR
  const testAlias = "testbsds";

  const testIndex: BsdIndexationConfig = {
    ...globalIndex,
    alias: testAlias
  };

  const testIndexV0: BsdIndexationConfig = {
    ...globalIndex,
    mappings_version: "v0",
    alias: testAlias
  };

  async function deleteTestIndexes() {
    await client.indices.delete({ index: "testbsds*" }, { ignore: [404] });
  }

  afterEach(async () => {
    await resetDatabase();
    await deleteTestIndexes();
  });

  it("should initialize an index and alias from scratch", async () => {
    const newIndex = await reindexAllBsdsInBulk({ index: testIndex });
    const catAliasResponses = await client.cat.aliases({
      name: testIndex.alias,
      format: "json"
    });
    expect(catAliasResponses.body).toHaveLength(1);
    const { alias, index: aliasedIndex } = catAliasResponses.body[0];
    expect(alias).toEqual(testIndex.alias);
    expect(aliasedIndex).toEqual(newIndex);
  });

  it("should not do anything when index and alias already exist and mapping is not changed", async () => {
    const user = await userFactory();
    await formFactory({ ownerId: user.id });

    // initialize index and alias
    await reindexAllBsdsInBulk({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse1 = await client.count({ index: testIndex.alias });

    // check the first form has been indexed
    expect(countResponse1.body.count).toEqual(1);

    // create a new form an index again
    await formFactory({ ownerId: user.id });
    await reindexAllBsdsInBulk({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse2 = await client.count({ index: testIndex.alias });
    // check the second form has not been indexed
    expect(countResponse2.body.count).toEqual(1);
    expect(countResponse2.body).toEqual(countResponse1.body);
  });

  it("should force reindex in place when force=true", async () => {
    const user = await userFactory();
    await formFactory({ ownerId: user.id });

    // initialize index and alias
    await reindexAllBsdsInBulk({ index: testIndex });

    await client.indices.refresh({
      index: testIndex.alias
    });
    const countResponse1 = await client.count({ index: testIndex.alias });

    // check the first form has been indexed
    expect(countResponse1.body.count).toEqual(1);

    // create a new form an index again with force=true
    await formFactory({ ownerId: user.id });
    await reindexAllBsdsInBulk({ index: testIndex, force: true });

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

    const newIndex = await reindexAllBsdsInBulk({
      index: testIndexV0
    });
    await client.indices.refresh({
      index: testIndexV0.alias
    });
    const initialIndices = await client.indices.get({
      index: `${testIndex.alias}${INDEX_ALIAS_NAME_SEPARATOR}*`
    });
    expect(Object.keys(initialIndices.body)).toEqual([newIndex]);

    const countResponse1 = await client.count({ index: testIndexV0.alias });
    // check the first form is indexed
    expect(countResponse1.body.count).toEqual(1);
    await formFactory({ ownerId: user.id });
    // create a new index version
    const secondIndex = await reindexAllBsdsInBulk({
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

    // check there is always 2 indices left by desgin
    const leftIndices = await client.indices.get({
      index: `${testIndex.alias}${INDEX_ALIAS_NAME_SEPARATOR}*`
    });
    expect(Object.keys(leftIndices.body).length).toEqual(2);
    expect(Object.keys(leftIndices.body)).toContainEqual(newIndex);
    expect(Object.keys(leftIndices.body)).toContainEqual(secondIndex);
  });
});
