import {
  MutationResolvers,
  QueryResolvers,
  IBsffOperationResolvers
} from "../../generated/graphql/types";
import { OPERATION_CODES, OPERATION_QUALIFICATIONS } from "../constants";
import bsffs from "./queries/bsffs";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";
import addFicheInterventionBsff from "./mutations/addFicheInterventionBsff";
import updateFicheInterventionBsff from "./mutations/updateFicheInterventionBsff";
import deleteFicheInterventionBsff from "./mutations/deleteFicheInterventionBsff";
import signBsff from "./mutations/signBsff";

const Query: QueryResolvers = {
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
  BsffOperationCode: OPERATION_CODES,
  BsffOperationQualification: OPERATION_QUALIFICATIONS,
  IBsffOperation
};
