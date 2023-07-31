import { Prisma } from "@prisma/client";
import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";
import { getUserCompanies } from "../../src/users/database";

@registerUpdater(
  "Init BSDD draft canAccessDraft field",
  "Drafts are now only visible to their creators companies.",
  true
)
export class InitBsddCanAccessDraft implements Updater {
  async run() {
    try {
      console.info("✨ Starting script to init BSDD canAccessDraft...");

      // There are around 330K drafts
      // And 25K different owners with drafts
      const draftOwnerIds = await prisma.form.findMany({
        where: {
          status: "DRAFT"
        },
        distinct: ["ownerId"],
        select: { ownerId: true }
      });

      console.info(
        `🔢 There are ${draftOwnerIds.length} DRAFT BSDD owners to process.`
      );

      for (const { ownerId } of draftOwnerIds) {
        // To speed up the migration, we assign all the owners companies to `canAccessDraftSirets`
        // We don't filter on sirets present on the form.
        // ES will filter when reindexing so it won't be a problem in the dashboard
        const ownerCompanies = await getUserCompanies(ownerId);
        const ownerOrgIds = ownerCompanies.map(company => company.orgId);

        await prisma.form.updateMany({
          where: {
            ownerId,
            status: "DRAFT"
          },
          data: {
            canAccessDraftSirets: ownerOrgIds
          }
        });
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
