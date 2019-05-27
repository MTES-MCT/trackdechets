import axios from "axios";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_SECRET, getUserId } from "../utils";
import { Context } from "../types";
import { prisma } from "../generated/prisma-client";
import { sendMail } from "../common/mails.helper";
import { userMails } from "./mails";
import companyResolver from "../companies/resolvers";
import { getCompanyAdmins, getUserCompanies } from "../companies/helper";

export default {
  Mutation: {
    signup: async (parent, { payload }, context: Context) => {
      const trimedSiret = payload.siret.replace(/\s+/g, "");

      const existingCompany = await context.prisma.$exists
        .company({
          siret: trimedSiret
        })
        .catch(err => {
          console.error("Error while checking company", err);
          throw new Error(
            "Erreur lors de la vérification du SIRET. Merci de réessayer."
          );
        });

      if (existingCompany) {
        throw new Error(
          "Cette entreprise a déjà un administrateur. Si vous pensez que c'est une erreur vous pouvez contacter le support."
        );
      }

      const hashedPassword = await hash(payload.password, 10);
      const company = await context.prisma
        .createCompany({
          siret: trimedSiret
        })
        .catch(err => {
          console.error("Error while creating user company", err);
          throw new Error(
            "Impossible de créer cet utilisateur. Veuillez contacter le support."
          );
        });

      const user = await context.prisma
        .createUser({
          name: payload.name,
          email: payload.email,
          password: hashedPassword,
          phone: payload.phone,
          userType: payload.userType,
          companyAssociations: {
            create: {
              role: "ADMIN",
              company: { connect: { id: company.id } }
            }
          }
        })
        .catch(err => {
          console.error("Error while creating user", err);
          throw new Error(
            "Impossible de créer cet utilisateur. Cet email a déjà un compte associé ou le mot de passe est vide."
          );
        });

      const activationHash = await hash(
        new Date().valueOf().toString() + Math.random().toString(),
        10
      );
      await context.prisma
        .createUserActivationHash({
          hash: activationHash,
          user: {
            connect: { id: user.id }
          }
        })
        .catch(err => {
          console.error("Error while creating user activation hash", err);
          throw new Error("Erreur technique. Le support a été informé.");
        });

      await sendMail(userMails.onSignup(user, activationHash));

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    login: async (parent, { email, password }, context: Context) => {
      const user = await context.prisma.user({ email: email.trim() });
      if (!user) {
        throw new Error(`Aucun utilisateur trouvé avec l'email ${email}`);
      }
      if (!user.isActive) {
        throw new Error(
          `Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support.`
        );
      }
      const passwordValid = await compare(password, user.password);
      if (!passwordValid) {
        throw new Error("Mot de passe incorrect");
      }
      return {
        token: sign({ userId: user.id }, APP_SECRET, { expiresIn: "1d" }),
        user
      };
    },
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      const userId = getUserId(context);

      const user = await context.prisma.user({ id: userId });
      const passwordValid = await compare(oldPassword, user.password);
      if (!passwordValid) {
        throw new Error("L'ancien mot de passe est incorrect.");
      }

      const hashedPassword = await hash(newPassword, 10);
      await prisma.updateUser({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return {
        token: sign({ userId: user.id }, APP_SECRET, { expiresIn: "1d" }),
        user
      };
    },
    resetPassword: async (_, { email }, context: Context) => {
      const user = await context.prisma.user({ email }).catch(_ => null);

      if (!user) {
        throw new Error(`Cet email n'existe pas sur notre plateforme.`);
      }

      const newPassword = Math.random()
        .toString(36)
        .slice(-10);
      const hashedPassword = await hash(newPassword, 10);
      await prisma.updateUser({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      await sendMail(
        userMails.resetPassword(user.email, user.name, newPassword)
      );
    },
    editProfile: (_, { name, phone, email, userType }, context) => {
      const userId = getUserId(context);

      return prisma
        .updateUser({
          where: { id: userId },
          data: { name, phone, userType }
        })
        .catch(err => {
          console.error(
            `Error while editing profile from user #${userId} with values ${JSON.stringify(
              { name, phone, email, userType }
            )}`,
            err
          );
          throw new Error("Impossible de mettre lr profil à jour");
        });
    },
    inviteUserToCompany: async (
      _,
      { email, siret, role },
      context: Context
    ) => {
      const userId = getUserId(context);
      const admins = await getCompanyAdmins(siret);
      const admin = admins.find(a => a.id === userId);

      if (!admin) {
        throw new Error(
          "Vous ne pouvez pas inviter un utilisateur dans cette entreprise."
        );
      }

      const existingUser = await context.prisma
        .user({ email })
        .catch(_ => null);

      const companyName = await companyResolver.Company.name({ siret });

      if (existingUser) {
        await context.prisma.createCompanyAssociation({
          user: { connect: { id: existingUser.id } },
          role,
          company: { connect: { siret } }
        });

        await sendMail(
          userMails.notifyUserOfInvite(
            existingUser.email,
            existingUser.name,
            admin.name,
            companyName
          )
        );
        return true;
      }

      const userAccoutHash = await hash(
        new Date().valueOf().toString() + Math.random().toString(),
        10
      );
      await prisma.createUserAccountHash({
        hash: userAccoutHash,
        email,
        role,
        companySiret: siret
      });

      await sendMail(
        userMails.inviteUserToJoin(
          email,
          admin.name,
          companyName,
          userAccoutHash
        )
      );

      return true;
    },
    joinWithInvite: async (
      _,
      { inviteHash, name, password },
      context: Context
    ) => {
      const existingHash = await prisma
        .userAccountHash({ hash: inviteHash })
        .catch(_ => {
          throw new Error(
            `Cette invitation n'est plus valable. Contactez le responsable de votre société.`
          );
        });

      const hashedPassword = await hash(password, 10);
      const user = await context.prisma.createUser({
        name: name,
        email: existingHash.email,
        password: hashedPassword,
        phone: "",
        userType: [],
        isActive: true,
        companyAssociations: {
          create: {
            company: { connect: { siret: existingHash.companySiret } },
            role: existingHash.role
          }
        }
      });

      await prisma
        .deleteUserAccountHash({ hash: inviteHash })
        .catch(err =>
          console.error(`Cannot delete user account hash ${inviteHash}`, err)
        );

      return {
        token: sign({ userId: user.id }, APP_SECRET, { expiresIn: "1d" }),
        user
      };
    },
    removeUserFromCompany: async (_, { userId, siret }, context: Context) => {
      const currentUserId = getUserId(context);
      const admins = await getCompanyAdmins(siret);

      if (!admins || !admins.find(a => a.id === currentUserId)) {
        throw new Error(
          "Vous ne pouvez pas retirer un utilisateur dans cette entreprise."
        );
      }

      await prisma
        .deleteManyCompanyAssociations({
          user: { id: userId },
          company: { siret: siret }
        })
        .catch(_ => {
          throw new Error(
            `Erreur, l'utilisateur n'a pa pu être retiré de l'entreprise`
          );
        });

      return true;
    }
  },
  Query: {
    me: async (parent, _, context) => {
      const userId = getUserId(context);
      return context.prisma.user({ id: userId });
    },
    apiKey: (parent, args, context: Context) => {
      const userId = getUserId(context);
      return sign({ userId: userId }, APP_SECRET);
    }
  },
  User: {
    companies: async parent => {
      return await getUserCompanies(parent.id);
    }
  }
};
