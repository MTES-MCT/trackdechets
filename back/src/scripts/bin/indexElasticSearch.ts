import { client, index } from "../../common/elastic";
import { indexAllBsdasris } from "../../bsdasris/elastic";
import { indexAllForms } from "../../forms/elastic";
import { indexAllBsvhus } from "../../vhu/elastic";
import { indexAllBsdas } from "../../bsda/elastic";
import prisma from "../../prisma";

(async function main() {
  const { statusCode, body } = await client.indices.getAlias(
    { name: index.alias },
    { ignore: [404] }
  );
  const oldIndexes = statusCode === 404 ? [] : Object.keys(body);
  const newIndex = index.index;

  if (oldIndexes.includes(newIndex)) {
    console.log(
      `The alias "${index.alias}" is already pointing to the current index "${newIndex}", which means there are no changes to apply.`,
      `To reindex all documents, the index must be bumped.`
    );
    if (process.argv.includes("-f")) {
      console.log(
        `The -f flag was passed, the index and alias are now being deleted...`
      );
      await client.indices.deleteAlias({
        index: newIndex,
        name: index.alias
      });
      await client.indices.delete({
        index: newIndex
      });
      return main();
    } else {
      console.log(
        `You can delete the current index and reindex all documents by calling this command again with the -f flag.`
      );
      await prisma.$disconnect();
      return;
    }
  } else {
    console.log(`Creating the new index "${newIndex}".`);
    await client.indices.create({
      index: newIndex,
      body: { mappings: { [index.type]: index.mappings } }
    });

    if (statusCode === 404) {
      console.log(
        `Creating the alias "${index.alias}" pointing to "${newIndex}".`
      );
      await client.indices.putAlias({
        name: index.alias,
        index: newIndex
      });
    }
  }

  console.log(
    `All the documents are being indexed in the new index "${newIndex}" while the alias "${index.alias}" still points to the old index.`
  );
  await indexAllForms(newIndex);
  await indexAllBsdasris(newIndex);
  await indexAllBsvhus(newIndex);
  await indexAllBsdas(newIndex);

  console.log(
    `All documents have been indexed, the alias "${index.alias}" will now point to the new index "${newIndex}".`
  );
  await client.indices.updateAliases({
    body: {
      actions: [
        ...oldIndexes.map(oldIndex => ({
          remove: {
            alias: index.alias,
            index: oldIndex
          }
        })),
        {
          add: {
            alias: index.alias,
            index: newIndex
          }
        }
      ]
    }
  });

  console.log(
    `There are no references to the old index anymore, it's now being deleted.`
  );
  for (const oldIndex of oldIndexes) {
    await client.indices.delete({
      index: oldIndex
    });
  }

  console.log(`All done, exiting.`);
  await prisma.$disconnect();
})();
