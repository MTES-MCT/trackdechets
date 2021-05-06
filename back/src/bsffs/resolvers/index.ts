import {
  MutationResolvers,
  BsffOperationCode as BsffOperationCodeEnum
} from "../../generated/graphql/types";
import createBsff from "./mutations/create";
import updateBsff from "./mutations/update";
import deleteBsff from "./mutations/delete";

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

export default { Mutation, BsffOperationCode };
