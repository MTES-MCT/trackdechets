import {
  MutationResolvers,
  BsffOperationCode as BsffOperationCodeEnum
} from "../../generated/graphql/types";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";

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
