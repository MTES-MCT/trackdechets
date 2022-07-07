import { Updater, registerUpdater } from "./helper/helper";
import { client, index } from "../../src/common/elastic";
import prisma from "../../src/prisma";
import { indexAllBsffs } from "../../src/bsffs/elastic";

type BsffPackagingJson = {
  name: string;
  numero: string;
  weight?: number;
  kilos?: number; // legacy field
  volume?: number;
  litres?: number; // legacy field
};

@registerUpdater(
  "Migrate bsff packagings to their own table",
  "Migrate bsff packagings to their own table",
  true
)
export class MigrateBsffPackagings implements Updater {
  async run() {
    const bsffs = await prisma.bsff.findMany({
      where: { packagings: { none: {} }, packagingsJson: { not: [] } }, // make it idempotent in case we have to re-run the script
      select: { id: true, packagingsJson: true }
    });
    for (const bsff of bsffs) {
      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          packagings: {
            createMany: {
              data: (bsff.packagingsJson as BsffPackagingJson[]).map(
                packaging => ({
                  name: packaging.name,
                  volume: packaging.volume ?? packaging.litres ?? 0,
                  numero: packaging.numero,
                  weight: packaging.weight ?? packaging.kilos ?? 0
                })
              )
            }
          }
        }
      });
    }

    const { container, container_search } = index.settings.analysis.analyzer;
    const { container_ngram, container_char_group } =
      index.settings.analysis.tokenizer;

    // update settings
    await client.indices.putSettings(
      {
        index: index.index,
        body: {
          settings: {
            analysis: {
              analyzer: { container, container_search },
              tokenizer: { container_ngram, container_char_group }
            }
          }
        }
      },
      {}
    );

    const { containers } = index.mappings.properties;
    // update mapping
    await client.indices.putMapping(
      {
        index: index.index,
        body: { properties: { containers } }
      },
      {}
    );

    // reindex bsffs in place
    await client.deleteByQuery({
      index: index.index,
      body: { query: { term: { type: "BSFF" } } }
    });

    await indexAllBsffs(index.index);
  }
}
