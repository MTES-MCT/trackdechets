import { prisma, GovernmentPermission } from "@td/prisma";

async function main() {
  const userEmail = "n.joubert@brgm.fr"; 

  await prisma.user.update({
    where: { email: userEmail },
    data: {
      governmentAccount: {
        create: {
          name: "MON_API_GOUV",
          permissions: [
            GovernmentPermission.REGISTRY_CAN_READ_ALL,
            GovernmentPermission.BSDS_CAN_READ_ALL,
            GovernmentPermission.BSDS_PDF_CAN_DOWNLOAD_ALL
          ],
          authorizedIPs: ["127.0.0.1"],
          authorizedOrgIds: ["ALL"]
        }
      }
    }
  });
  console.log("Account created");
}

main().catch(console.error);