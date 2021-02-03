import { User } from "@prisma/client";
import prisma from "../../prisma";

export default async function mergeUsers(user: User, heir: User) {
  await transferUserForms(user, heir);
  await transferUserStatusLogs(user, heir);
  await transferUserCompanies(user, heir);
  await transferUserAccessTokens(user, heir);
  await transferUserApplications(user, heir);
}

async function transferUserForms(user: User, heir: User) {
  const forms = await prisma.form.findMany({
    where: { owner: { id: user.id } }
  });

  for (const form of forms) {
    await prisma.form.update({
      data: {
        owner: {
          connect: {
            id: heir.id
          }
        }
      },
      where: {
        id: form.id
      }
    });
  }
}

async function transferUserStatusLogs(user: User, heir: User) {
  const statusLogs = await prisma.statusLog.findMany({
    where: {
      user: {
        id: user.id
      }
    }
  });

  for (const statusLog of statusLogs) {
    await prisma.statusLog.update({
      data: {
        user: {
          connect: {
            id: heir.id
          }
        }
      },
      where: {
        id: statusLog.id
      }
    });
  }
}

async function transferUserCompanies(user: User, heir: User) {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: { user: { id: user.id } },
    include: {
      user: { select: { id: true } },
      company: { select: { id: true, siret: true } }
    }
  });

  for (const association of companyAssociations) {
    const [heirCompanyAssociation] = await prisma.companyAssociation.findMany({
      where: {
        company: {
          id: association.company.id
        },
        user: {
          id: heir.id
        }
      }
    });

    if (heirCompanyAssociation == null) {
      await prisma.companyAssociation.create({
        data: {
          role: association.role,
          user: {
            connect: {
              id: heir.id
            }
          },
          company: {
            connect: {
              id: association.company.id
            }
          }
        }
      });
    } else if (
      association.role === "ADMIN" &&
      heirCompanyAssociation.role !== "ADMIN"
    ) {
      await prisma.companyAssociation.update({
        data: {
          role: "ADMIN"
        },
        where: {
          id: heirCompanyAssociation.id
        }
      });
    }
  }
}

async function transferUserAccessTokens(user: User, heir: User) {
  const accessTokens = await prisma.accessToken.findMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
  for (const accessToken of accessTokens) {
    await prisma.accessToken.update({
      data: {
        user: {
          connect: {
            id: heir.id
          }
        }
      },
      where: {
        id: accessToken.id
      }
    });
  }
}

async function transferUserApplications(user: User, heir: User) {
  const applications = await prisma.application.findMany({
    where: {
      admins: {
        some: { id: user.id }
      }
    }
  });

  for (const application of applications) {
    const [{ admins }] = await prisma.application.findMany({
      where: {
        id: application.id
      },
      include: { admins: { select: { id: true } } }
    });

    if (admins.find(admin => admin.id === heir.id) == null) {
      await prisma.application.update({
        data: {
          admins: {
            connect: {
              id: heir.id
            }
          }
        },
        where: {
          id: application.id
        }
      });
    }
  }
}
