import { MutationResolvers } from "../../generated/graphql/types";
import createBsff from "./mutations/create";
import updateBsff from "./mutations/update";
import deleteBsff from "./mutations/delete";

const Mutation: MutationResolvers = {
  createBsff,
  updateBsff,
  deleteBsff
};

export default { Mutation };
