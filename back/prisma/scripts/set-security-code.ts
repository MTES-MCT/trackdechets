import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";
import { randomNumber } from "../../src/utils";


@registerUpdater(
  "Set security code",
  `New column securityCode in Company has to be set (0 otherwise for existing companies)`,
  false
)
export class SetSecurityCodeUpdater implements Updater {
  run() {
    console.info(
      "Starting script to set security codes for existing companies..."
    );

    try {
      return prisma
        .updateManyCompanies({
          where: { securityCode: 0 },
          data: { securityCode: randomNumber(4) }
        })
        .then(async batch => {
          console.info(`${batch.count} companies updated`);
          console.info(`⚡ Update done.`);
        });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
