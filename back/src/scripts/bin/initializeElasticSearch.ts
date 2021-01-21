import { client, index } from "../../common/elastic";
import { indexAllForms } from "../../forms/elastic";

(async () => {
  await createIndexIfNotFound();
  await createAliasIfNotFound();

  const { body } = await client.indices.getAlias({ name: index.alias });
  const aliasIndexes = Object.keys(body);

  if (aliasIndexes.includes(index.index)) {
    // the alias is already pointing to the appropriate index
    // which means the data doesn't have to be reindexed,
    // otherwise the index would have changed and thus not found
    return;
  }

  // index data in the new index before updating the alias
  await indexAllForms();

  // now that the data has been indexed,
  // we can update the alias so it points to the new index
  await client.indices.updateAliases({
    body: {
      actions: [
        ...aliasIndexes.map(oldIndex => ({
          remove: {
            alias: index.alias,
            index: oldIndex
          }
        })),
        {
          add: {
            alias: index.alias,
            index: index.index
          }
        }
      ]
    }
  });

  for (const oldIndex of aliasIndexes) {
    await client.indices.delete({
      index: oldIndex
    });
  }
})();

async function createIndexIfNotFound() {
  const { statusCode } = await client.indices.get(
    { index: index.index },
    { ignore: [404] }
  );
  if (statusCode === 404) {
    await client.indices.create({
      index: index.index,
      body: { mappings: index.mappings }
    });
  }
}

async function createAliasIfNotFound() {
  const { statusCode } = await client.indices.getAlias(
    { name: index.alias },
    { ignore: [404] }
  );
  if (statusCode === 404) {
    await client.indices.putAlias({
      name: index.alias,
      index: index.index
    });
  }
}
