import deleteOrphanCompanies from "../../src/scripts/prisma/deleteOrphanCompanies";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Remove orphan companies",
  "Remove orphan companies without any member",
  false
)
export class RemoveOrphanCompanies implements Updater {
  async run() {
    console.info("Starting script to delete orphan companies...");
    await deleteOrphanCompanies();
  }
}
