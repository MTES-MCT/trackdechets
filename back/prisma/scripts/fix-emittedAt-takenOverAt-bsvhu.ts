import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set transporterTransportTakenOverAt = emitterEmissionSignatureDate for all BSVHUs where emitterEmissionSignatureDate > transporterTransportTakenOverAt",
  "Set transporterTransportTakenOverAt = emitterEmissionSignatureDate for all BSVHUs where emitterEmissionSignatureDate > transporterTransportTakenOverAt",
  true
)
export class UpdateBSDDTakenOverAt implements Updater {
  async run() {
    const nbr: number =
      await prisma.$executeRaw`update "default$default"."Bsvhu"
      set "transporterTransportTakenOverAt" = "emitterEmissionSignatureDate"
      where "emitterEmissionSignatureDate" > "transporterTransportTakenOverAt";`;

    console.info(`${nbr} BSVHUs updated`);
  }
}
