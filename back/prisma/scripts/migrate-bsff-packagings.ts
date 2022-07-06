import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";

type BsffPackagingJson = {
  name: string;
  numero: string;
  weight?: number; // this field may be absent in
  kilos?: number; // legacy field
  volume?: number;
  litres?: number; // legacy field
};

@registerUpdater(
  "Migrate bsff packagings to their own table",
  "Migrate bsff packagings to their own table",
  true
)
export class MigrateBsffPackagings implements Updater {
  async run() {
    const bsffs = await prisma.bsff.findMany({
      where: { packagings: { none: {} }, packagingsJson: { not: [] } }, // make it idempotent in case we have to re-run the script
      select: { id: true, packagingsJson: true }
    });
    for (const bsff of bsffs) {
      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          packagings: {
            createMany: {
              data: (bsff.packagingsJson as BsffPackagingJson[]).map(
                packaging => ({
                  name: packaging.name,
                  volume: packaging.volume ?? packaging.litres ?? 0,
                  numero: packaging.numero,
                  weight: packaging.weight ?? packaging.kilos ?? 0
                })
              )
            }
          }
        }
      });
    }
  }
}
