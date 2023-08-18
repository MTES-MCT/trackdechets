import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";
import { getUserCompanies } from "../../src/users/database";

@registerUpdater(
  "Init BSDD draft canAccessDraft field",
  "Drafts are now only visible to their creators companies.",
  false
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
      const draftOwnerCount = draftOwnerIds.length;
      console.info(
        `🔢 There are ${draftOwnerCount} DRAFT BSDD owners to process.`
      );
      let count = 0;
      for (const { ownerId } of draftOwnerIds) {
        count += 1;
        console.info(`Owner ${count} of ${draftOwnerCount}`);
        // To speed up the migration, we assign all the owners companies to `canAccessDraftSirets`
        // We don't filter on sirets present on the form.
        // - for the permission we intersect canAccessDraftSirets with the actual contributors
        // - ES will filter when reindexing so it won't be a problem in the dashboard
        // So this should not be a security issue
        const ownerCompanies = await getUserCompanies(ownerId);
        const ownerOrgIds = ownerCompanies.map(company => company.orgId);

        await prisma.form.updateMany({
          where: {
            ownerId,
            status: "DRAFT",
            isDeleted: false
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
