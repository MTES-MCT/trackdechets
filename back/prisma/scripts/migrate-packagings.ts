import * as readline from "readline";
import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "../../src/generated/prisma-client";
import { Packagings } from "../../src/generated/graphql/types";

@registerUpdater(
  "Migrate packagings",
  `Migrate from fields [packagings, otherPackaging, numberOfPackages] to packagingInfos`,
  true
)
export class MigratePackagingsUpdater implements Updater {
  async run() {
    console.info(
      "Starting script to migrate packagings to the new 'packagingInfos' field..."
    );

    try {
      // Cannot do { where: {wasteDetailsPackagingInfos: null}} here :(
      const forms = await prisma.forms();
      const notMigratedForms = forms.filter(
        f => f.wasteDetailsPackagingInfos == null
      );

      console.info(
        `There is ${notMigratedForms.length} packaging infos to migrate.`
      );

      const updateParams = notMigratedForms.map(form => {
        const { wasteDetailsNumberOfPackages: numberOfPackages } = form;
        const packagings: Packagings[] = form.wasteDetailsPackagings ?? [];

        // If numberOfPackages is 0 or less we obviously have corrupted data
        // So we "kind of uncorrupt" the data by assigning 0 to each
        const maxPackagesPerPackaging =
          numberOfPackages > 0
            ? Math.ceil(numberOfPackages / packagings.length)
            : 0;

        return {
          where: { id: form.id },
          data: {
            wasteDetailsPackagingInfos: packagings.map((p, idx) => {
              return {
                type: p,
                other: p === "AUTRE" ? form.wasteDetailsOtherPackaging : null,
                // For n packages and m packagings, we assign ceil(n/m) packages to each packagings
                // So the last packagings might have a lower value (can be 0 but not lower)
                quantity: Math.max(
                  0,
                  Math.min(
                    maxPackagesPerPackaging,
                    numberOfPackages - maxPackagesPerPackaging * idx
                  )
                )
              };
            })
          }
        };
      });

      // Batch update to avoid playing too many updates on the DB at once (there should be around 10K updates)
      const BATCH_SIZE = 50;
      const numberOfBatches = Math.ceil(notMigratedForms.length / BATCH_SIZE);
      let counter = 0;

      while (updateParams.length) {
        await Promise.all(
          updateParams
            .splice(0, BATCH_SIZE)
            .map(param => prisma.updateForm(param))
        );
        counter++;

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(
          `Playing batched updates... ${counter}/${numberOfBatches} done - ${BATCH_SIZE} updates by batch.`
        );
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
