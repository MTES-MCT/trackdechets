import { Status } from "@prisma/client";
import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Denormalize sirets",
  `Populate forms sirets after schema denormalization`,
  true
)
export class DenormalizeFormSiretsUpdater implements Updater {
  async run() {
    console.info("Starting denormalization script...");

    try {
      const listOfStatus = Object.values(Status);
      console.info("1/3 Populating recipientsSirets...");

      for (const status of listOfStatus) {
        console.info(`Processing status = ${status} batch`);
        await prisma.$executeRawUnsafe(`
          UPDATE default$default."Form" AS f1
          SET "recipientsSirets" =
          array_remove(
            array(SELECT f2."recipientCompanySiret"
              FROM default$default."Form" AS f2
              WHERE f2.id = f1."forwardedInId"
              UNION SELECT f1."recipientCompanySiret"
            ),
            NULL
          )
          WHERE "status" = '${status}';`);
      }

      console.info("2/3 Populating transportersSirets...");
      for (const status of listOfStatus) {
        console.info(`Processing status = ${status} batch`);
        await prisma.$executeRawUnsafe(`
          UPDATE default$default."Form" AS f1
          SET "transportersSirets" =
            array_remove(
              array(
                SELECT ts."transporterCompanySiret"
                  FROM default$default."TransportSegment" AS ts
                  WHERE ts."formId" = f1."id"
                UNION SELECT f2."transporterCompanySiret"
                  FROM default$default."Form" AS f2
                  WHERE f2.id = f1."forwardedInId"
                UNION SELECT f1."transporterCompanySiret"
              ),
              NULL
            )
          WHERE "status" = '${status}';`);
      }

      console.info("3/3 Populating intermediariesSirets...");
      for (const status of listOfStatus) {
        console.info(`Processing status = ${status} batch`);
        await prisma.$executeRawUnsafe(`
          UPDATE default$default."Form" AS f1
          SET "intermediariesSirets" =
            array_remove(
              array(
                SELECT i."siret"
                FROM default$default."IntermediaryFormAssociation" AS i
                WHERE i."formId" = f1."id"
              ),
              NULL
            )
          WHERE "status" = '${status}';`);
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
