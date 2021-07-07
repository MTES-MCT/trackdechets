import { MutationResolvers } from "../../generated/graphql/types";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";
import createFicheInterventionBsff from "./mutations/createFicheInterventionBsff";
import updateFicheInterventionBsff from "./mutations/updateFicheInterventionBsff";
import signBsff from "./mutations/signBsff";

export const Mutation: MutationResolvers = {
  createBsff,
  updateBsff,
  deleteBsff,
  createFicheInterventionBsff,
  updateFicheInterventionBsff,
  signBsff
};
