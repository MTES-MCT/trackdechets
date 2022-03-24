import deleteOrphanCompanies from "../../src/scripts/prisma/deleteOrphanCompanies";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Remove oprhan companies",
  "Remove orphan companies without any member",
  true
)
export class RemoveOrphanCompanies implements Updater {
  run() {
    console.info("Starting script to delete orphan companies...");
    return deleteOrphanCompanies();
  }
}
