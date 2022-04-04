import createBsdasri from "./mutations/create";
import createDraftBsdasri from "./mutations/createDraftBsdasri";
import updateBsdasri from "./mutations/updateBsdasri";
import publishBsdasri from "./mutations/publishBsdasri";
import signBsdasri from "./mutations/signBsdasri";
import deleteBsdasri from "./mutations/deleteBsdasri";
import signBsdasriEmissionWithSecretCode from "./mutations/signBsdasriEmissionWithSecretCode";
import duplicateBsdasri from "./mutations/duplicateBsdasri";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";

const Mutation: MutationResolvers = {
  createDraftBsdasri,
  createBsdasri,
  updateBsdasri,
  publishBsdasri,
  signBsdasri,
  signBsdasriEmissionWithSecretCode,
  duplicateBsdasri,
  deleteBsdasri
};

export default Mutation;
