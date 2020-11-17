import { User, UserRole } from "@prisma/client";
import prisma from "src/prisma";

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

  await prisma.user.delete({
    where: { id: user.id }
  });
}

async function checkForms(user: User): Promise<string[]> {
  const forms = await prisma.form.findMany({
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
  const statusLogs = await prisma.statusLog.findMany({
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
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      user: {
        id: user.id
      }
    },
    include: {
      company: { select: { id: true } }
    }
  });

  for (const association of companyAssociations) {
    if (association.role !== "ADMIN") {
      continue;
    }

    const otherAdmins = await prisma.companyAssociation.findMany({
      where: {
        role: "ADMIN",
        user: {
          id: { not: user.id }
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
  await prisma.companyAssociation.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

async function checkApplications(user: User): Promise<string[]> {
  const errors = [];
  const applications = await prisma.application.findMany({
    where: {
      admins: {
        some: {
          id: user.id
        }
      }
    }
  });
  for (const application of applications) {
    const { admins } = await prisma.application.findOne({
      where: { id: application.id },
      include: { admins: { select: { id: true } } }
    });

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
  const applications = await prisma.application.findMany({
    where: {
      admins: {
        some: { id: user.id }
      }
    }
  });
  for (const application of applications) {
    await prisma.application.update({
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
  await prisma.userActivationHash.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

async function deleteUserAccessTokens(user: User) {
  await prisma.accessToken.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

async function deleteUserGrants(user: User) {
  await prisma.grant.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}
