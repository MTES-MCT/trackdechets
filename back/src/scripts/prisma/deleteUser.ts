import { prisma, User, UserRole } from "../../generated/prisma-client";

export default async function deleteUser(user: User) {
  const errors = [
    ...(await checkForms(user)),
    ...(await checkStatusLogs(user)),
    ...(await checkCompanyAssociations(user)),
    ...(await checkApplications(user))
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  await deleteUserCompanyAssociations(user);
  await removeUserFromApplications(user);
  await deleteUserActivationHashes(user);
  await deleteUserAccessTokens(user);
  await deleteUserGrants(user);

  await prisma.deleteUser({
    id: user.id
  });
}

async function checkForms(user: User): Promise<string[]> {
  const forms = await prisma.forms({
    where: {
      owner: {
        id: user.id
      }
    }
  });

  if (forms.length > 0) {
    return [
      `Impossible de supprimer cet utilisateur car il est propriétaire de ${forms.length} BSDs.`
    ];
  }

  return [];
}

async function checkStatusLogs(user: User): Promise<string[]> {
  const statusLogs = await prisma.statusLogs({
    where: {
      user: {
        id: user.id
      }
    }
  });

  if (statusLogs.length > 0) {
    return [
      `Impossible de supprimer cet utilisateur car il est propriétaire de ${statusLogs.length} status logs.`
    ];
  }

  return [];
}

async function checkCompanyAssociations(user: User): Promise<string[]> {
  const errors = [];
  const companyAssociations = await prisma
    .companyAssociations({
      where: {
        user: {
          id: user.id
        }
      }
    })
    .$fragment<
      Array<{
        id: string;
        role: UserRole;
        company: { id: string };
      }>
    >(
      `fragment DeletedUserCompanyAssociation on CompanyAssociation {
        id
        role
        company {
          id
        }
      }`
    );
  for (const association of companyAssociations) {
    if (association.role !== "ADMIN") {
      continue;
    }

    const otherAdmins = await prisma.companyAssociations({
      where: {
        role: "ADMIN",
        user: {
          id_not: user.id
        },
        company: {
          id: association.company.id
        }
      }
    });
    if (otherAdmins.length <= 0) {
      errors.push(
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise ${association.company.id}.`
      );
    }
  }

  return errors;
}

async function deleteUserCompanyAssociations(user: User) {
  await prisma.deleteManyCompanyAssociations({
    user: {
      id: user.id
    }
  });
}

async function checkApplications(user: User): Promise<string[]> {
  const errors = [];
  const applications = await prisma.applications({
    where: {
      admins_some: {
        id: user.id
      }
    }
  });
  for (const application of applications) {
    const { admins } = await prisma
      .application({ id: application.id })
      .$fragment<{ id: string; admins: Array<{ id: string }> }>(
        `fragment DeletedUserApplication on Application {
          id
          admins {
            id
          }
        }`
      );
    const otherAdmins = admins.filter(admin => admin.id !== user.id);
    if (otherAdmins.length <= 0) {
      errors.push(
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'application ${application.id}.`
      );
    }
  }

  return errors;
}

async function removeUserFromApplications(user: User) {
  const applications = await prisma.applications({
    where: {
      admins_some: {
        id: user.id
      }
    }
  });
  for (const application of applications) {
    await prisma.updateApplication({
      data: {
        admins: {
          disconnect: [
            {
              id: user.id
            }
          ]
        }
      },
      where: {
        id: application.id
      }
    });
  }
}

async function deleteUserActivationHashes(user: User) {
  await prisma.deleteManyUserActivationHashes({
    user: {
      id: user.id
    }
  });
}

async function deleteUserAccessTokens(user: User) {
  await prisma.deleteManyAccessTokens({
    user: {
      id: user.id
    }
  });
}

async function deleteUserGrants(user: User) {
  await prisma.deleteManyGrants({
    user: {
      id: user.id
    }
  });
}
