import { prisma, User, UserRole } from "../../generated/prisma-client";

export default async function mergeUsers(user: User, heir: User) {
  await transferUserForms(user, heir);
  await transferUserStatusLogs(user, heir);
  await transferUserCompanies(user, heir);
  await transferUserAccessTokens(user, heir);
  await transferUserApplications(user, heir);
}

async function transferUserForms(user: User, heir: User) {
  const forms = await prisma.forms({ where: { owner: { id: user.id } } });

  for (const form of forms) {
    await prisma.updateForm({
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
  const statusLogs = await prisma.statusLogs({
    where: {
      user: {
        id: user.id
      }
    }
  });

  for (const statusLog of statusLogs) {
    await prisma.updateStatusLog({
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
  const companyAssociations = await prisma
    .companyAssociations({
      where: { user: { id: user.id } }
    })
    .$fragment<
      Array<{
        id: string;
        role: UserRole;
        user: { id: string };
        company: { id: string; siret: string };
      }>
    >(
      `fragment CompanyAssociation on CompanyAssociation {
          id
          role
          user {
            id
          }
          company {
            id
            siret
          }
        }`
    );

  for (const association of companyAssociations) {
    const [heirCompanyAssociation] = await prisma.companyAssociations({
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
      await prisma.createCompanyAssociation({
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
      });
    } else if (
      association.role === "ADMIN" &&
      heirCompanyAssociation.role !== "ADMIN"
    ) {
      await prisma.updateCompanyAssociation({
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
  const accessTokens = await prisma.accessTokens({
    where: {
      user: {
        id: user.id
      }
    }
  });
  for (const accessToken of accessTokens) {
    await prisma.updateAccessToken({
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
  const applications = await prisma.applications({
    where: {
      admins_some: {
        id: user.id
      }
    }
  });

  for (const application of applications) {
    const [{ admins }] = await prisma
      .applications({
        where: {
          id: application.id
        }
      })
      .$fragment<Array<{ id: string; admins: Array<{ id: string }> }>>(
        `fragment Application on Application {
          id
          admins {
            id
          }
        }`
      );

    if (admins.find(admin => admin.id === heir.id) == null) {
      await prisma.updateApplication({
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
