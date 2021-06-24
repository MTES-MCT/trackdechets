import { MutationResolvers } from "../../generated/graphql/types";
import createBsff from "./mutations/createBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";
import addFicheInterventionBsff from "./mutations/addFicheInterventionBsff";
import updateFicheInterventionBsff from "./mutations/updateFicheInterventionBsff";
import deleteFicheInterventionBsff from "./mutations/deleteFicheInterventionBsff";
import signBsff from "./mutations/signBsff";

export const Mutation: MutationResolvers = {
  createBsff,
  updateBsff,
  deleteBsff,
  addFicheInterventionBsff,
  updateFicheInterventionBsff,
  deleteFicheInterventionBsff,
  signBsff
};
