import { updateBsvhuTakenOverAt } from "../../src/scripts/prisma/updateBsvhuTakenOverAt";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set transporterTransportTakenOverAt = emitterEmissionSignatureDate for all BSVHUs where emitterEmissionSignatureDate > transporterTransportTakenOverAt",
  "Set transporterTransportTakenOverAt = emitterEmissionSignatureDate for all BSVHUs where emitterEmissionSignatureDate > transporterTransportTakenOverAt",
  false
)
export class UpdateBSVHUTakenOverAt implements Updater {
  async run() {
    const nbr: number = await updateBsvhuTakenOverAt({
      gte: new Date("2023-01-10"), // release 2023.1.1 du 10/01/23 introduction du bug tra-10777
      lte: new Date("2023-01-25") // hotfix du 25/01/23
    });

    console.info(`${nbr} BSVHUs updated`);
  }
}
