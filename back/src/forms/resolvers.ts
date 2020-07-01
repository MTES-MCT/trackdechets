import { getUserCompanies } from "../companies/queries";
import { prisma, Status } from "../generated/prisma-client";
import { unflattenObjectFromDb } from "./form-converter";
import {
  markAsProcessed,
  markAsReceived,
  markAsSealed,
  markAsSent,
  signedByTransporter,
  markAsTempStored,
  markAsResent,
  markAsResealed
} from "./mutations/mark-as";
import {
  prepareSegment,
  markSegmentAsReadyToTakeOver,
  takeOverSegment,
  editSegment
} from "./mutations/multiModal";
import { duplicateForm } from "./mutations";
import { saveForm } from "./mutations/save-form";
import { updateTransporterFields } from "./mutations/updateTransporterFields";
import { formPdf } from "./queries/form-pdf";
import forms from "./queries/forms";
import { formsRegister } from "./queries/forms-register";
import { AuthenticationError } from "apollo-server-express";
import { stateSummary } from "./queries/state-summary";
import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
  FormResolvers,
  WasteDetailsResolvers,
  StateSummaryResolvers
} from "../generated/graphql/types";
import { PROCESSING_OPERATIONS } from "../common/constants";
import { transportSegments } from "./queries/segments";

import { formsLifecycle } from "./queries/formsLifecycle";

const queryResolvers: QueryResolvers = {
  form: async (_, { id }) => {
    if (!id) {
      // On form creation, there is no id
      return null;
    }

    const dbForm = await prisma.form({ id });
    return unflattenObjectFromDb(dbForm);
  },
  forms: (_parent, args, context) => forms(context.user.id, args),

  formsLifeCycle: formsLifecycle,

  stats: async (_parent, _args, context) => {
    const userId = context.user.id;
    const userCompanies = await getUserCompanies(userId);

    return userCompanies.map(async userCompany => {
      const queriedForms = await prisma.forms({
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

      const stats = queriedForms.reduce((prev, cur) => {
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
  appendixForms: async (_parent, { siret, wasteCode }) => {
    const queriedForms = await prisma.forms({
      where: {
        ...(wasteCode && { wasteDetailsCode: wasteCode }),
        status: "AWAITING_GROUP",
        recipientCompanySiret: siret,
        isDeleted: false
      }
    });

    return queriedForms.map(f => unflattenObjectFromDb(f));
  },
  formPdf: (_parent, args) => formPdf(args),
  formsRegister: (_parent, args) => formsRegister(args),
  processingOperations: () => PROCESSING_OPERATIONS
};

const mutationResolvers: MutationResolvers = {
  saveForm: (_parent, args, context) => saveForm(context.user.id, args),
  deleteForm: async (_parent, { id }) => {
    const form = await prisma.updateForm({
      where: { id },
      data: { isDeleted: true }
    });
    return { ...form, status: form.status as Status };
  },
  duplicateForm: (_parent, args, { user }) => duplicateForm(user.id, args),
  markAsSealed: (_parent, args, context) => markAsSealed(args, context),
  markAsSent: (_parent, args, context) => markAsSent(args, context),
  markAsReceived: (_parent, args, context) => markAsReceived(args, context),
  markAsProcessed: (_parent, args, context) => markAsProcessed(args, context),
  signedByTransporter: (_parent, args, context) =>
    signedByTransporter(args, context),
  updateTransporterFields: (_parent, args) => updateTransporterFields(args),
  markAsTempStored: (_parent, args, context) => markAsTempStored(args, context),
  markAsResealed: (_parent, args, context) => markAsResealed(args, context),
  markAsResent: (_parent, args, context) => markAsResent(args, context),
  prepareSegment: (_parent, args, context) => prepareSegment(args, context),
  markSegmentAsReadyToTakeOver: (_parent, args, context) =>
    markSegmentAsReadyToTakeOver(args, context),
  takeOverSegment: (_parent, args, context) => takeOverSegment(args, context),
  editSegment: (_parent, args, context) => editSegment(args, context)
};

const formResolvers: FormResolvers = {
  appendix2Forms: parent => {
    return prisma.form({ id: parent.id }).appendix2Forms();
  },
  ecoOrganisme: parent => {
    return prisma.form({ id: parent.id }).ecoOrganisme();
  },
  temporaryStorageDetail: async parent => {
    const temporaryStorageDetail = await prisma
      .form({ id: parent.id })
      .temporaryStorageDetail();

    return temporaryStorageDetail
      ? unflattenObjectFromDb(temporaryStorageDetail)
      : null;
  },
  // Somme contextual values, depending on the form status / type, mostly to ease the display
  stateSummary: parent => stateSummary(parent),

  transportSegments: parent => transportSegments(parent)
};

const wasteDetailsResolvers: WasteDetailsResolvers = {
  packagings: parent => parent.packagings || []
};

const stateSummaryResolvers: StateSummaryResolvers = {
  packagings: parent => parent.packagings || []
};

const subscriptionResolvers: SubscriptionResolvers = {
  forms: {
    subscribe: async (parent, { token }) => {
      // Web socket has no headers so we pass the token as a param

      const user = await prisma.accessToken({ token }).user();

      if (!user) {
        throw new AuthenticationError("Vous n'êtes pas connecté");
      }

      const userCompanies = await getUserCompanies(user.id);

      return prisma.$subscribe.form({
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
};

export default {
  Form: formResolvers,
  WasteDetails: wasteDetailsResolvers,
  StateSummary: stateSummaryResolvers,
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers
};
