import { sendMail } from "../common/mails.helper";
import { getInstallation } from "../companies/queries";
import { prisma } from "../generated/prisma-client";
import { userMails } from "./mails";
import {
  changePassword,
  editProfile,
  inviteUserToCompany,
  resendInvitation,
  login,
  joinWithInvite
} from "./mutations";
import signup from "./mutations/signup";
import { hashPassword, generatePassword } from "./utils";
import { apiKey } from "./queries";
import {
  QueryResolvers,
  MutationResolvers,
  UserResolvers,
  CompanyPrivate
} from "../generated/graphql/types";
import { getUserCompanies } from "./database";
import { checkIsAuthenticated } from "../common/permissions";
import { searchCompany } from "../companies/sirene";

const queryResolvers: QueryResolvers = {
  me: async (_parent, _args, context) => {
    const userId = context.user.id;
    return prisma.user({ id: userId });
  },
  apiKey: (_parent, _args, context) => apiKey(context.user)
};

const mutationResolvers: MutationResolvers = {
  signup: (_parent, { userInfos }) => signup(userInfos),
  login: async (_parent, args) => login(args),
  changePassword: async (_, args, context) => {
    const userId = context.user.id;
    return changePassword(userId, args);
  },
  resetPassword: async (_, { email }) => {
    const user = await prisma.user({ email }).catch(__ => null);
    if (!user) {
      throw new Error(`Cet email n'existe pas sur notre plateforme.`);
    }
    const newPassword = generatePassword();
    const hashedPassword = await hashPassword(newPassword);
    await prisma.updateUser({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    await sendMail(userMails.resetPassword(user.email, user.name, newPassword));
    return true;
  },
  editProfile: (_, args, context) => {
    const userId = context.user.id;
    return editProfile(userId, args);
  },
  inviteUserToCompany: async (_, args, context) =>
    inviteUserToCompany(context.user, args),
  resendInvitation: async (_, args, context) =>
    resendInvitation(context.user, args),
  joinWithInvite: async (_, args) => joinWithInvite(args),
  removeUserFromCompany: async (_, { userId, siret }) => {
    await prisma
      .deleteManyCompanyAssociations({
        user: { id: userId },
        company: { siret }
      })
      .catch(__ => {
        throw new Error(
          `Erreur, l'utilisateur n'a pas pu être retiré de l'entreprise`
        );
      });

    return prisma.company({ siret });
  },

  deleteInvitation: async (_, { email, siret }) => {
    try {
      await prisma.deleteManyUserAccountHashes({ email, companySiret: siret });
    } catch {
      throw new Error(`Erreur, l'invitation n'a pas pu être supprimée`);
    }
    return prisma.company({ siret });
  }
};

const userResolvers: UserResolvers = {
  // Returns the list of companies a user belongs to
  // Information from TD, Sirene, and s3ic are merged
  // to make up an instance of CompanyPrivate
  companies: async parent => {
    const companies = await getUserCompanies(parent.id);
    return Promise.all(
      companies.map(async company => {
        let companyPrivate: CompanyPrivate = company;
        try {
          // try to set naf, libelleNaf and address from SIRENE database
          const { naf, libelleNaf, address } = await searchCompany(
            company.siret
          );
          companyPrivate = { ...companyPrivate, naf, libelleNaf, address };
        } catch {}

        // retrieves associated ICPE
        const installation = await getInstallation(company.siret);
        return { ...companyPrivate, installation };
      })
    );
  }
};

export default {
  Mutation: mutationResolvers,
  Query: queryResolvers,
  User: userResolvers
};
