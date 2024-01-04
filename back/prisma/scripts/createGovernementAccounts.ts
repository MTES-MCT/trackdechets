import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Create government accounts",
  "Create government accounts",
  false
)
export class CreateGovernementAccounts implements Updater {
  async run() {
    const registreNationalUsers = await prisma.user.findMany({
      where: { isRegistreNational: true }
    });
    for (const user of registreNationalUsers) {
      if (!user.governmentAccountId) {
        const accountName = user.email.includes("gerep") ? "GEREP" : "RNDTS";
        await prisma.user.update({
          where: { id: user.id },
          data: {
            governmentAccount: {
              create: {
                permissions: ["REGISTRY_CAN_READ_ALL"],
                name: accountName,
                authorizedOrgIds: ["ALL"],
                authorizedIPs: [] // à compléter à la mano
              }
            }
          }
        });
      }
    }
  }
}
