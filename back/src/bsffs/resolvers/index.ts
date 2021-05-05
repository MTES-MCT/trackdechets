import { MutationResolvers } from "../../generated/graphql/types";
import createBsff from "./mutations/create";
import updateBsff from "./mutations/update";

const Mutation: MutationResolvers = {
  createBsff,
  updateBsff
};

export default { Mutation };
