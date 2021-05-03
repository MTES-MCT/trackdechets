import createBsdasri from "./mutations/createBsdasri";
import createDraftBsdasri from "./mutations/createDraftBsdasri";
import updateBsdasri from "./mutations/updateBsdasri";
import publishBsdasri from "./mutations/publishBsdasri";
import signBsdasri from "./mutations/signBsdasri";
import signBsdasriEmissionWithSecretCode from "./mutations/signBsdasriEmissionWithSecretCode";
import duplicateBsdasri from "./mutations/duplicateBsdasri";
import { MutationResolvers } from "../../generated/graphql/types";

const Mutation: MutationResolvers = {
  createDraftBsdasri,
  createBsdasri,
  updateBsdasri,
  publishBsdasri,
  signBsdasri,
  signBsdasriEmissionWithSecretCode,
  duplicateBsdasri
};

export default Mutation;
