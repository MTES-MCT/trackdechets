import {
  MutationResolvers,
  BsffOperationCode as BsffOperationCodeEnum,
  QueryResolvers,
  IBsffOperationResolvers
} from "../../generated/graphql/types";
import bsffs from "./queries/bsffs";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";

const Query: QueryResolvers = {
  bsffs
};

const Mutation: MutationResolvers = {
  createBsff,
  updateBsff,
  deleteBsff
};

const BsffOperationCode: Record<BsffOperationCodeEnum, string> = {
  R2: "R 2",
  R12: "R 12",
  D10: "D 10",
  D13: "D 13",
  D14: "D 14"
};

const IBsffOperation: IBsffOperationResolvers = {
  __resolveType: operation => {
    if ("signature" in operation) {
      return "BsffOperation";
    }
    return "BsffPlannedOperation";
  }
};

export default { Query, Mutation, BsffOperationCode, IBsffOperation };
