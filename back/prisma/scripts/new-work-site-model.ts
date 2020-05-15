import axios from "axios";
import { prisma } from "../../src/generated/prisma-client";
import { Updater, registerUpdater } from ".";

@registerUpdater(
  "Set work site",
  `Migrate old "pickupSite" field to new "workSite*" fields`,
  false
)
export class SetWorkSiteUpdater implements Updater {
  async run() {
    console.info("Starting script to set work site...");

    try {
      // We'll query `api-adresse.data.gouv.fr` to migrate `emitterPickupSite`
      // If we have a match, that's great ! Otherwise we use `emitterWorkSiteInfos`.
      const forms = await prisma.forms({
        where: {
          emitterPickupSite_not_in: ["", "-"],
          emitterWorkSiteInfos: null
        }
      });

      console.info(`⚒ ${forms.length} with an emitterPickupSite to migrate.`);
      console.info(
        `⏳ About to query adress.beta.gouv for every address, please wait...`
      );

      const workSitesPromises = forms
        .map(f => f.emitterPickupSite)
        .reduce(
          (unique, item) =>
            unique.includes(item) ? unique : [...unique, item],
          []
        )
        .map(async site => ({ from: site, to: await getWorkSite(site) }));

      const workSites = await Promise.all(workSitesPromises);
      console.info(
        `✨ All done. We had ${
          workSites.map(ws => ws.to.emitterPickupSite == null).length
        } match(es).`
      );

      const modifications = forms.map(f => {
        const data = workSites.find(ws => ws.from === f.emitterPickupSite).to;
        return prisma.updateForm({
          data,
          where: { id: f.id }
        });
      });
      return Promise.all(modifications);
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}

async function getWorkSite(text: string) {
  const splittedText = text.split("\n");
  const guessedName = splittedText[0];
  const guessedAdressDescription =
    splittedText.length > 1 ? splittedText.slice(1).join(" ") : text;

  const address = await axios
    .get(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURI(
        guessedAdressDescription
      )}&type=housenumber&autocomplete=0&limit=1`
    )
    .then(response => {
      return response.data.features[0].properties;
    })
    .catch(err => {
      console.error(
        `Error: ${err.message} for name "${guessedName}" and address "${guessedAdressDescription}"`
      );
      return { score: 0 };
    });

  // After some testing, 0.8 seems fair enough...
  if (address.score > 0.8) {
    return {
      emitterWorkSiteName: guessedName,
      emitterWorkSiteAddress: address.name,
      emitterWorkSiteCity: address.city,
      emitterWorkSitePostalCode: address.postcode,
      emitterWorkSiteInfos: "",
      emitterPickupSite: null // We have a match ! Empty emitterPickupSite
    };
  }

  return {
    emitterWorkSiteName: guessedName,
    emitterWorkSiteAddress: "",
    emitterWorkSiteCity: "",
    emitterWorkSitePostalCode: "",
    emitterWorkSiteInfos: guessedAdressDescription
  };
}
