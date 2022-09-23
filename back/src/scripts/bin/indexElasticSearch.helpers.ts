import { client, indexAllBsds, BsdIndex } from "../../common/elastic";
import prisma from "../../prisma";
import { BsdType } from "../../generated/graphql/types";

/**
 * Reindex all or given bsd type documents "in place" in the current index. Useful when
 * you want to force a reindex without bumping index version.
 * WARNING : it will cause a read downtime during the time of the reindex.
 */
async function reindexInPlace(index: BsdIndex, bsdType?: BsdType) {
  let query = {};
  if (bsdType) {
    console.log(`Deleting ${bsdType} entries`);
    query = {
      match: {
        type: bsdType
      }
    };
  } else {
    console.log(`Deleting all entries`);
    query = { match_all: {} };
  }

  await client.deleteByQuery({
    index: index.index,
    body: { query: query }
  });
  await indexAllBsds(index.index, bsdType);
}

/**
 * Bump a new index. During indexation, the alias still points to the old index
 * to avoid read downtimes. At the end of the indexation, the alias is reconfigured to
 * point to the new index.
 * WARNING : write operations are directed to the new index to guarantee eventual consistency
 * of the new index (see `indexBsd`). As a consequence, inconsistent reads can happen during
 * the time of indexation.
 */
async function bumpIndex(oldIndex: string, index: BsdIndex) {
  const newIndex = index.index;
  console.log(`Creating the new index "${newIndex}".`);
  await client.indices.create({
    index: newIndex,
    body: {
      mappings: { [index.type]: index.mappings },
      settings: index.settings
    }
  });
  console.log(
    `All the documents are being indexed in the new index "${newIndex}" while the alias "${index.alias}" still points to the old index.`
  );

  await indexAllBsds(newIndex);

  console.log(
    `All documents have been indexed, the alias "${index.alias}" will now point to the new index "${newIndex}".`
  );
  await client.indices.updateAliases({
    body: {
      actions: [
        {
          remove: {
            alias: index.alias,
            index: oldIndex
          }
        },
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

  await client.indices.delete({
    index: oldIndex
  });
}

/**
 * Creates a brand new index and alias from scratch
 */
async function initializeIndex(index: BsdIndex) {
  const newIndex = index.index;
  console.log(`Creating the new index "${newIndex}".`);
  await client.indices.create({
    index: newIndex,
    body: {
      mappings: { [index.type]: index.mappings },
      settings: index.settings
    }
  });
  console.log(
    `All the documents are being indexed in the new index "${newIndex}".`
  );

  await indexAllBsds(newIndex);
  console.log(
    `All documents have been indexed, the alias "${index.alias}". Creating the alias "${index.alias}" pointing to "${newIndex}"`
  );

  await client.indices.putAlias({
    name: index.alias,
    index: newIndex
  });
}

type IndexElasticSearchOpts = {
  force?: boolean;
  index: BsdIndex;
  bsdTypeToIndex?: BsdType;
};

export async function indexElasticSearch({
  index,
  force = false,
  bsdTypeToIndex = undefined
}: IndexElasticSearchOpts) {
  const newIndex = index.index;

  const catAliasesResponse = await client.cat.aliases({
    name: index.alias,
    format: "json"
  });

  const aliasExists = catAliasesResponse.body.length > 0;

  if (!aliasExists) {
    await initializeIndex(index);
  } else {
    const { index: oldIndex } = catAliasesResponse.body[0];
    if (oldIndex === newIndex) {
      if (force && !bsdTypeToIndex) {
        console.log(
          `The -f flag was passed, documents are being reindexed in place.`
        );
        await bumpIndex(index.index, {
          ...index,
          index: `${index.index}_force_${Date.now()}`
        });
      } else if (force && bsdTypeToIndex) {
        await reindexInPlace(index, bsdTypeToIndex);
      } else {
        console.log(
          `The alias "${index.alias}" is already pointing to the current index "${newIndex}", which means there are no changes to apply.`,
          `To reindex all documents, the index must be bumped or you may reindex all documents in place by calling this command again with the -f flag.`
        );
      }
    } else {
      await bumpIndex(oldIndex, index);
    }
  }

  console.log(`All done, exiting.`);
  await prisma.$disconnect();
}
