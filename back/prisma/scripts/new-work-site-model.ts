import { prisma } from "../../src/generated/prisma-client";
import { Updater, registerUpdater } from ".";

@registerUpdater(
  "Set work site",
  `Migrate old "pickupSite" field to new "workSite*" fields`
)
export class SetWorkSiteUpdater implements Updater {
  run() {
    console.info("Starting script to set work site...");

    try {
      // We migrate `emitterPickupSite` to `emitterWorkSiteInfos`
      // as we have no way of structuring the existing `emitterPickupSite` data...
      return prisma
        .forms({
          where: {
            emitterPickupSite_not_in: ["", "-"],
            emitterWorkSiteInfos: null
          }
        })
        .then(forms => {
          const modifications = forms.map(f =>
            prisma.updateForm({
              data: { emitterWorkSiteInfos: f.emitterPickupSite },
              where: { id: f.id }
            })
          );
          return Promise.all(modifications);
        });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
