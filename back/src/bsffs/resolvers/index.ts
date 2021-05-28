import prisma from "../../prisma";
import {
  MutationResolvers,
  QueryResolvers,
  IBsffOperationResolvers,
  BsffResolvers
} from "../../generated/graphql/types";
import { OPERATION_CODES, OPERATION_QUALIFICATIONS } from "../constants";
import { unflattenBsff, unflattenFicheInterventionBsff } from "../converter";
import { isBsffContributor } from "../permissions";
import bsff from "./queries/bsff";
import bsffs from "./queries/bsffs";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";
import addFicheInterventionBsff from "./mutations/addFicheInterventionBsff";
import updateFicheInterventionBsff from "./mutations/updateFicheInterventionBsff";
import deleteFicheInterventionBsff from "./mutations/deleteFicheInterventionBsff";
import signBsff from "./mutations/signBsff";

const Query: QueryResolvers = {
  bsff,
  bsffs
};

const Mutation: MutationResolvers = {
  createBsff,
  updateBsff,
  deleteBsff,
  addFicheInterventionBsff,
  updateFicheInterventionBsff,
  deleteFicheInterventionBsff,
  signBsff
};

const Bsff: BsffResolvers = {
  ficheInterventions: async (parent, _, context) => {
    const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
      where: {
        bsffId: parent.id
      }
    });
    const unflattenedFicheInterventions = ficheInterventions.map(
      unflattenFicheInterventionBsff
    );

    try {
      await isBsffContributor(context.user, {
        emitterCompanySiret: parent.emitter?.company?.siret,
        transporterCompanySiret: parent.transporter?.company?.siret,
        destinationCompanySiret: parent.destination?.company?.siret
      });
    } catch (err) {
      unflattenedFicheInterventions.forEach(ficheIntervention => {
        delete ficheIntervention.owner;
      });
    }

    return unflattenedFicheInterventions;
  },
  bsffs: async parent => {
    const bsffs = await prisma.bsff.findMany({
      where: {
        bsffId: parent.id
      }
    });
    return bsffs.map(bsff => ({
      ...unflattenBsff(bsff),
      ficheInterventions: [],
      bsffs: []
    }));
  }
};

const IBsffOperation: IBsffOperationResolvers = {
  __resolveType: operation => {
    if ("signature" in operation) {
      return "BsffOperation";
    }
    return "BsffPlannedOperation";
  }
};

export default {
  Query,
  Mutation,
  Bsff,
  BsffOperationCode: OPERATION_CODES,
  BsffOperationQualification: OPERATION_QUALIFICATIONS,
  IBsffOperation
};
