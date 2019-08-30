import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";

@registerUpdater(
  "Set userType",
  `The userType property was added afterwards. We initialize it to an empty array instead of null`,
  false
)
export class SetContactsUpdater implements Updater {
  run() {
    console.info("Starting script to initialize empty userTypes...");

    try {
      return prisma.users().then(async users => {
        const usersToUpdate = users.filter(u => u.userType == null);

        console.info(
          `-> ${
            usersToUpdate.length
          } users identified with an empty userType. About to update...`
        );
        return prisma.updateManyUsers({
          data: { userType: [] },
          where: { id_in: usersToUpdate.map(u => u.id) }
        });
      });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
