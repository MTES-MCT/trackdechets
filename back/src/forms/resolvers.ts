import { getUserCompanies } from "../companies/helper";
import { Context } from "../types";
import { getUserIdFromToken } from "../utils";
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
import { getReadableId } from "./readable-id";

export default {
  Form: {
    appendix2Forms: (parent, args, context: Context) => {
      return context.prisma.form({ id: parent.id }).appendix2Forms();
    }
  },
  Query: {
    form: async (_, { id }, context: Context) => {
      if (!id) {
        // On form creation, there is no id
        return null;
      }

      const dbForm = await context.prisma.form({ id });
      return unflattenObjectFromDb(dbForm);
    },
    forms: async (_, { siret, type }, context: Context) => {
      const userId = context.user.id;
      const userCompanies = await getUserCompanies(userId);

      if (!userCompanies.length) {
        throw new Error("Vous n'êtes pas autorisé à consulter les bordereaux.");
      }

      // Find on userCompanies to make sure that the siret belongs to the current user
      const selectedCompany =
        userCompanies.find(uc => uc.siret === siret) || userCompanies.shift();

      const formsFilter = {
        ACTOR: {
          OR: [
            { owner: { id: userId } },
            { recipientCompanySiret: selectedCompany.siret },
            { emitterCompanySiret: selectedCompany.siret }
          ]
        },
        TRANSPORTER: {
          transporterCompanySiret: selectedCompany.siret,
          status: "SEALED"
        }
      };

      const forms = await context.prisma.forms({
        where: {
          ...formsFilter[type],
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    },
    stats: async (parent, args, context: Context) => {
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
    appendixForms: async (parent, { siret, wasteCode }, context: Context) => {
      const forms = await context.prisma.forms({
        where: {
          ...(wasteCode && { wasteDetailsCode: wasteCode }),
          status: "AWAITING_GROUP",
          recipientCompanySiret: siret,
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    }
  },
  Mutation: {
    saveForm,
    deleteForm: async (parent, { id }, context: Context) => {
      return context.prisma.updateForm({
        where: { id },
        data: { isDeleted: true }
      });
    },
    duplicateForm: async (parent, { id }, context: Context) => {
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
      subscribe: async (parent, { token }, context: Context) => {
        // Web socket has no headers so we pass the token as a param
        const userId = getUserIdFromToken(token);
        const userCompanies = await getUserCompanies(userId);

        return context.prisma.$subscribe.form({
          OR: [
            ...userCompanies.map(userCompany => ({
              node: { emitterCompanySiret: userCompany.siret }
            })),
            ...userCompanies.map(userCompany => ({
              node: { recipientCompanySiret: userCompany.siret }
            })),
            { node: { owner: { id: userId } } }
          ]
        });
      },
      resolve: payload => {
        return payload;
      }
    }
  }
};
