import { unescape } from "node:querystring";
import { PrismaClient, UserRole } from "@prisma/client";
import { subYears } from "date-fns";
const { TUNNELED_DB } = process.env;

/*
  Database clients init
*/

if (!TUNNELED_DB) {
  throw new Error("TUNNELED_DB is not defined");
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(TUNNELED_DB) }
  },
  log: []
});

const runVHU = async () => {
  let finished = false;
  let lastId: string | null = null;
  let usermails: string[] = [];
  const alreadySeenSirets = {};
  while (!finished) {
    const lastYearVHU = await prisma.bsvhu.findMany({
      take: 100,
      skip: lastId ? 1 : 0, // Skip the cursor
      ...(lastId
        ? {
            cursor: {
              id: lastId
            }
          }
        : {}),
      where: {
        updatedAt: {
          gte: subYears(new Date(), 1)
        }
      },
      select: {
        id: true,
        emitterCompanySiret: true,
        destinationCompanySiret: true,
        destinationOperationNextDestinationCompanySiret: true,
        transporterCompanySiret: true
      }
    });

    if (lastYearVHU.length < 10) {
      finished = true;
    }
    if (lastYearVHU.length === 0) {
      break;
    }
    lastId = lastYearVHU[lastYearVHU.length - 1].id;
    const concatSiret = lastYearVHU.reduce((acc, vhu) => {
      const val = [
        vhu.emitterCompanySiret,
        vhu.destinationCompanySiret,
        vhu.destinationOperationNextDestinationCompanySiret,
        vhu.transporterCompanySiret
      ].filter(Boolean);
      return acc.concat(val);
    }, []);
    const filteredSirets = concatSiret.filter((siret: string) => {
      if (!alreadySeenSirets[siret]) {
        alreadySeenSirets[siret] = true;
        return true;
      }
      return false;
    });
    if (filteredSirets.length > 0) {
      const companies = await prisma.company.findMany({
        where: {
          siret: {
            in: filteredSirets
          },
          companyAssociations: {
            some: {
              user: {
                AccessToken: {
                  some: {}
                }
              }
            }
          }
        },
        select: {
          companyAssociations: {
            select: {
              role: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });
      const usersToAdd = companies.reduce((acc: string[], company) => {
        const userEmails = company.companyAssociations
          .filter(asso => asso.role === UserRole.ADMIN)
          .map(asso => asso.user.email);
        return acc.concat(userEmails);
      }, []);
      usermails = usermails.concat(usersToAdd);
      console.log(usersToAdd.length);
    } else {
      console.log("no comp");
    }
  }
  const uniqueMails = [...new Set(usermails)];
  for (const mail of uniqueMails) {
    console.log(mail);
  }

  console.log("ALL DONE !");
};

const runPAOH = async () => {
  let finished = false;
  let lastId: string | null = null;
  let usermails: string[] = [];
  const alreadySeenSirets = {};
  while (!finished) {
    const lastYearPAOH = await prisma.bspaoh.findMany({
      take: 100,
      skip: lastId ? 1 : 0, // Skip the cursor
      ...(lastId
        ? {
            cursor: {
              id: lastId
            }
          }
        : {}),
      where: {
        updatedAt: {
          gte: subYears(new Date(), 1)
        }
      },
      select: {
        id: true,
        emitterCompanySiret: true,
        destinationCompanySiret: true,
        transporters: {
          select: {
            transporterCompanySiret: true,
            transporterCompanyVatNumber: true
          }
        }
      }
    });

    if (lastYearPAOH.length < 10) {
      finished = true;
    }
    if (lastYearPAOH.length === 0) {
      break;
    }
    lastId = lastYearPAOH[lastYearPAOH.length - 1].id;
    const concatSiret = lastYearPAOH.reduce((acc, paoh) => {
      let val = [paoh.emitterCompanySiret, paoh.destinationCompanySiret];
      if (paoh.transporters?.length) {
        paoh.transporters.forEach(trans =>
          val.push(
            trans.transporterCompanySiret ?? trans.transporterCompanyVatNumber
          )
        );
      }
      val = val.filter(Boolean);
      return acc.concat(val);
    }, []);
    const filteredSirets = concatSiret.filter((siret: string) => {
      if (!alreadySeenSirets[siret]) {
        alreadySeenSirets[siret] = true;
        return true;
      }
      return false;
    });
    if (filteredSirets.length > 0) {
      const companies = await prisma.company.findMany({
        where: {
          orgId: {
            in: filteredSirets
          },
          companyAssociations: {
            some: {
              user: {
                AccessToken: {
                  some: {}
                }
              }
            }
          }
        },
        select: {
          companyAssociations: {
            select: {
              role: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });
      const usersToAdd = companies.reduce((acc: string[], company) => {
        const userEmails = company.companyAssociations
          .filter(asso => asso.role === UserRole.ADMIN)
          .map(asso => asso.user.email);
        return acc.concat(userEmails);
      }, []);
      usermails = usermails.concat(usersToAdd);
      console.log(usersToAdd.length);
    } else {
      console.log("no comp");
    }
  }
  const uniqueMails = [...new Set(usermails)];
  for (const mail of uniqueMails) {
    console.log(mail);
  }

  console.log("ALL DONE !");
};

// runVHU();
runPAOH();
