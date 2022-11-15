import { MutationResolvers } from "../../generated/graphql/types";
import createBsffResolver from "./mutations/createBsff";
import createDraftBsff from "./mutations/createDraftBsff";
import publishBsff from "./mutations/publishBsff";
import updateBsff from "./mutations/updateBsff";
import deleteBsff from "./mutations/deleteBsff";
import createFicheInterventionBsff from "./mutations/createFicheInterventionBsff";
import updateFicheInterventionBsff from "./mutations/updateFicheInterventionBsff";
import signBsff from "./mutations/signBsff";
import duplicateBsff from "./mutations/duplicateBsff";
import updateBsffPackaging from "./mutations/updateBsffPackaging";

export const Mutation: MutationResolvers = {
  createBsff: createBsffResolver,
  createDraftBsff,
  publishBsff,
  updateBsff,
  deleteBsff,
  duplicateBsff,
  createFicheInterventionBsff,
  updateFicheInterventionBsff,
  signBsff,
  updateBsffPackaging
};
