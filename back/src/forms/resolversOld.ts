import { prisma, Status } from "../generated/prisma-client";
import { expandTemporaryStorageFromDb } from "./form-converter";
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
import { updateTransporterFields } from "./mutations/updateTransporterFields";
import { AuthenticationError } from "apollo-server-express";
import { stateSummary } from "./queries/state-summary";
import {
  MutationResolvers,
  SubscriptionResolvers,
  FormResolvers,
  WasteDetailsResolvers,
  StateSummaryResolvers
} from "../generated/graphql/types";
import { transportSegments } from "./queries/segments";
import { getUserCompanies } from "../users/database";

const mutationResolvers: MutationResolvers = {
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
      ? expandTemporaryStorageFromDb(temporaryStorageDetail)
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
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers
};
