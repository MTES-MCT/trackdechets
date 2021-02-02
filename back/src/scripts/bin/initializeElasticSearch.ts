import { client, index } from "../../common/elastic";
import { indexAllForms } from "../../forms/elastic";
import prisma from "../../prisma";

(async () => {
  if (process.argv.includes("--reset")) {
    console.log(
      `The --reset flag was passed, now deleting alias "${index.alias}" and index "${index.index}"...`
    );
    await client.indices.deleteAlias(
      {
        index: index.index,
        name: index.alias
      },
      { ignore: [404] }
    );
    await client.indices.delete(
      {
        index: index.index
      },
      { ignore: [404] }
    );
  }

  const { statusCode, body } = await client.indices.getAlias(
    { name: index.alias },
    { ignore: [404] }
  );
  const aliasIndexes = statusCode === 404 ? [] : Object.keys(body);

  if (statusCode === 404) {
    console.log(
      `The index "${index.index}" doesn't exist yet, now creating...`
    );
    await client.indices.create({
      index: index.index,
      body: { mappings: index.mappings }
    });

    console.log(
      `The alias "${index.alias}" doesn't exist yet, now creating...`
    );
    await client.indices.putAlias({
      name: index.alias,
      index: index.index
    });
  } else if (aliasIndexes.includes(index.index)) {
    console.log(
      `The alias "${index.alias}" already exists and points to the current index "${index.index}".`,
      `Indexing data with this configuration may index documents that are already indexed.`,
      `You can run this script with the flag --reset to start fresh by deleting all existing data.`,
      `Otherwise, change the name of the index to trigger a seamless reindexation.`
    );
    return;
  }

  console.log(`Indexing all forms...`);
  await indexAllForms();

  console.log(`Changing the alias' pointer to the newly created index...`);
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
    console.log(`Deleting the old index "${oldIndex}"...`);
    await client.indices.delete({
      index: oldIndex
    });
  }

  await prisma.$disconnect();

  console.log("Done!");
})();
