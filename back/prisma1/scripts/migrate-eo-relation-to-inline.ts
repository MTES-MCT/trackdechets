import { Updater, registerUpdater } from "./helper/helper";
import migrateEORelationToInline from "../../src/scripts/prisma/migrateEORelationToInline";

@registerUpdater(
  "Migrate the forms' eco-organisme relation",
  "Replace eco-organisme relation with inline eco-organisme fields",
  true
)
export class MigrateEORelationToInline implements Updater {
  async run() {
    await migrateEORelationToInline();
  }
}
