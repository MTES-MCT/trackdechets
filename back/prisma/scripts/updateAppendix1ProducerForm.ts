import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set transporter values on APPENDIX1_PRODUCER form from values in APPENDIX1 form",
  "Set transporter values on APPENDIX1_PRODUCER form from values in APPENDIX1 form",
  true
)
export class UpdateAppendix1ProducerForm implements Updater {
  // Certains champs transporteur n'était pas copiés du bordereau
  // chapeau vers les annexes 1 dans 'setAppendix1' ce qui causait une erreur
  // de validation. Ce script permet d'effectuer un rattrapage sur les BSDDs
  // existants.
  async run() {
    const appendix1Forms = await prisma.form.findMany({
      where: { emitterType: "APPENDIX1" },
      include: {
        grouping: true
      }
    });

    for (const appendix1Form of appendix1Forms) {
      if (appendix1Form.grouping) {
        const appendix1ProducersFormIds = appendix1Form.grouping.map(
          g => g.initialFormId
        );

        await prisma.form.updateMany({
          where: {
            id: { in: appendix1ProducersFormIds },
            emitterType: "APPENDIX1_PRODUCER"
          },
          data: {
            transporterIsExemptedOfReceipt:
              appendix1Form.transporterIsExemptedOfReceipt,
            transporterReceipt: appendix1Form.transporterReceipt,
            transporterDepartment: appendix1Form.transporterDepartment,
            transporterValidityLimit: appendix1Form.transporterValidityLimit,
            transporterTransportMode: appendix1Form.transporterTransportMode
          }
        });
      }
    }
  }
}
