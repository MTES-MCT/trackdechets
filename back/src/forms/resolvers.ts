import { DomainError, ErrorCode } from "../common/errors";
import { getUserCompanies } from "../companies/queries";
import { prisma } from "../generated/prisma-client";
import { GraphQLContext } from "../types";
import {
  cleanUpNotDuplicatableFieldsInForm,
  unflattenObjectFromDb
} from "./form-converter";
import {
  markAsProcessed,
  markAsReceived,
  markAsSealed,
  markAsSent,
  signedByTransporter
} from "./mutations/mark-as";
import { saveForm } from "./mutations/save-form";
import { formPdf } from "./queries/form-pdf";
import forms from "./queries/forms";
import { formsRegister } from "./queries/forms-register";
import { getReadableId } from "./readable-id";

export default {
  Form: {
    appendix2Forms: (parent, args, context: GraphQLContext) => {
      return context.prisma.form({ id: parent.id }).appendix2Forms();
    }
  },
  Query: {
    form: async (_, { id }, context: GraphQLContext) => {
      if (!id) {
        // On form creation, there is no id
        return null;
      }

      const dbForm = await context.prisma.form({ id });
      return unflattenObjectFromDb(dbForm);
    },
    forms,
    stats: async (parent, args, context: GraphQLContext) => {
      const userId = context.user.id;
      const userCompanies = await getUserCompanies(userId);

      return userCompanies.map(async userCompany => {
        const forms = await context.prisma.forms({
          where: {
            OR: [
              { owner: { id: userId } },
              { recipientCompanySiret: userCompany.siret },
              { emitterCompanySiret: userCompany.siret }
            ],
            status: "PROCESSED",
            isDeleted: false
          }
        });

        const stats = forms.reduce((prev, cur) => {
          prev[cur.wasteDetailsCode] = prev[cur.wasteDetailsCode] || {
            wasteCode: cur.wasteDetailsCode,
            incoming: 0,
            outgoing: 0
          };
          cur.recipientCompanySiret === userCompany.siret
            ? (prev[cur.wasteDetailsCode].incoming += cur.quantityReceived)
            : (prev[cur.wasteDetailsCode].outgoing += cur.quantityReceived);

          prev[cur.wasteDetailsCode].incoming =
            Math.round(prev[cur.wasteDetailsCode].incoming * 100) / 100;
          prev[cur.wasteDetailsCode].outgoing =
            Math.round(prev[cur.wasteDetailsCode].outgoing * 100) / 100;

          return prev;
        }, {});

        return {
          company: userCompany,
          stats: Object.keys(stats).map(key => stats[key])
        };
      });
    },
    appendixForms: async (
      parent,
      { siret, wasteCode },
      context: GraphQLContext
    ) => {
      const forms = await context.prisma.forms({
        where: {
          ...(wasteCode && { wasteDetailsCode: wasteCode }),
          status: "AWAITING_GROUP",
          recipientCompanySiret: siret,
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    },
    formPdf,
    formsRegister
  },
  Mutation: {
    saveForm,
    deleteForm: async (parent, { id }, context: GraphQLContext) => {
      return context.prisma.updateForm({
        where: { id },
        data: { isDeleted: true }
      });
    },
    duplicateForm: async (parent, { id }, context: GraphQLContext) => {
      const userId = context.user.id;

      const existingForm = await context.prisma.form({
        id
      });

      const newForm = await context.prisma.createForm({
        ...cleanUpNotDuplicatableFieldsInForm(existingForm),
        readableId: await getReadableId(context),
        status: "DRAFT",
        owner: { connect: { id: userId } }
      });

      return unflattenObjectFromDb(newForm);
    },
    markAsSealed,
    markAsSent,
    markAsReceived,
    markAsProcessed,
    signedByTransporter
  },
  Subscription: {
    forms: {
      subscribe: async (parent, { token }, context: GraphQLContext) => {
        // Web socket has no headers so we pass the token as a param

        const user = await prisma.accessToken({ token }).user();

        if (!user) {
          throw new DomainError(ErrorCode.UNAUTHENTICATED);
        }

        const userCompanies = await getUserCompanies(user.id);

        return context.prisma.$subscribe.form({
          OR: [
            ...userCompanies.map(userCompany => ({
              node: { emitterCompanySiret: userCompany.siret }
            })),
            ...userCompanies.map(userCompany => ({
              node: { recipientCompanySiret: userCompany.siret }
            })),
            { node: { owner: { id: user.id } } }
          ]
        });
      },
      resolve: payload => {
        return payload;
      }
    }
  }
};
