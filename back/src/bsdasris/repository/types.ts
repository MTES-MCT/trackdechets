import { CountBsdasrisFn } from "./bsdasri/count";
import { CreateBsdasriFn } from "./bsdasri/create";
import { DeleteBsdasriFn } from "./bsdasri/delete";
import { FindManyBsdasriFn } from "./bsdasri/findMany";
import { FindRelatedEntityFn } from "./bsdasri/findRelatedEntity";
import { FindUniqueBsdasriFn } from "./bsdasri/findUnique";
import { UpdateBsdasriFn } from "./bsdasri/update";
import { UpdateManyBsdasriFn } from "./bsdasri/updateMany";
import { AcceptRevisionRequestApprovalFn } from "./revisionRequest/accept";
import { CancelRevisionRequestFn } from "./revisionRequest/cancel";
import { CountRevisionRequestFn } from "./revisionRequest/count";
import { CreateRevisionRequestFn } from "./revisionRequest/create";
import { FindManyBsdasriRevisionRequestFn } from "./revisionRequest/findMany";
import { FindUniqueRevisionRequestFn } from "./revisionRequest/findUnique";
import { RefuseRevisionRequestApprovalFn } from "./revisionRequest/refuse";

export type BsdasriActions = {
  findUnique: FindUniqueBsdasriFn;
  findRelatedEntity: FindRelatedEntityFn;
  findMany: FindManyBsdasriFn;
  create: CreateBsdasriFn;
  update: UpdateBsdasriFn;
  updateMany: UpdateManyBsdasriFn;
  delete: DeleteBsdasriFn;
  count: CountBsdasrisFn;

  countRevisionRequests: CountRevisionRequestFn;
  findUniqueRevisionRequest: FindUniqueRevisionRequestFn;
  findManyBsdasriRevisionRequest: FindManyBsdasriRevisionRequestFn;
  createRevisionRequest: CreateRevisionRequestFn;
  cancelRevisionRequest: CancelRevisionRequestFn;
  acceptRevisionRequestApproval: AcceptRevisionRequestApprovalFn;
  refuseRevisionRequestApproval: RefuseRevisionRequestApprovalFn;
};
