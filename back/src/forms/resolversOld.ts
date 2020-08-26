import { prisma } from "../generated/prisma-client";
import { expandTemporaryStorageFromDb } from "./form-converter";
import {
  markAsProcessed,
  markAsReceived,
  markAsTempStored,
  markAsResent,
  markAsResealed
} from "./mutations/mark-as";
import {
  prepareSegment,
  markSegmentAsReadyToTakeOver,
  takeOverSegment,
  editSegment
} from "./resolvers/mutations/multiModal";
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
  WasteDetails: wasteDetailsResolvers,
  StateSummary: stateSummaryResolvers,
  Subscription: subscriptionResolvers
};
