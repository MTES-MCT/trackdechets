import createBsdasri from "./mutations/create";
import createDraftBsdasri from "./mutations/createDraftBsdasri";
import updateBsdasri from "./mutations/updateBsdasri";
import publishBsdasri from "./mutations/publishBsdasri";
import signBsdasri from "./mutations/signBsdasri";
import deleteBsdasri from "./mutations/deleteBsdasri";
import signBsdasriEmissionWithSecretCode from "./mutations/signBsdasriEmissionWithSecretCode";
import duplicateBsdasri from "./mutations/duplicateBsdasri";
import type { MutationResolvers } from "@td/codegen-back";

import { createBsdasriRevisionRequest } from "./mutations/revisionRequest/createRevisionRequest";
import { cancelBsdasriRevisionRequest } from "./mutations/revisionRequest/cancelRevisionRequest";
import { submitBsdasriRevisionRequestApproval } from "./mutations/revisionRequest/submitRevisionRequestApproval";

const Mutation: MutationResolvers = {
  createDraftBsdasri,
  createBsdasri,
  updateBsdasri,
  publishBsdasri,
  signBsdasri,
  signBsdasriEmissionWithSecretCode,
  duplicateBsdasri,
  deleteBsdasri,
  createBsdasriRevisionRequest: createBsdasriRevisionRequest as any,
  cancelBsdasriRevisionRequest,
  submitBsdasriRevisionRequestApproval:
    submitBsdasriRevisionRequestApproval as any
};

export default Mutation;
