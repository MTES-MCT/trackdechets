import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "../../src/generated/prisma-client";

async function setCurrentTransporterSiret() {
  try {
    const forms = await prisma.forms({
      where: {
        AND: [
          {
            OR: [
              { currentTransporterSiret: "" },
              { currentTransporterSiret: null }
            ]
          },
          { status: "SENT" }
        ]
      }
    });
    const updates = [];

    for (const form of forms) {
      const update = prisma.updateForm({
        data: { currentTransporterSiret: form.transporterCompanySiret },
        where: { id: form.id }
      });
      updates.push(update);
    }
    return await Promise.all(updates);
  } catch (err) {
    console.error("☠ Something went wrong during the update", err);
    throw new Error();
  }
}

@registerUpdater(
  "Set current transporter siret field",
  `New column currentTransporterSiret filled with transporter company siret on SENT forms`,
  true
)
export class SetCurrentTransporterSiret implements Updater {
  run() {
    console.info(
      "Starting script to set currentTransporterSiret for existing forms..."
    );

    return setCurrentTransporterSiret();
  }
}
