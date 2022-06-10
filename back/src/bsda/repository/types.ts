import { CountBsdasFn } from "./bsda/count";
import { CreateBsdaFn } from "./bsda/create";
import { DeleteBsdaFn } from "./bsda/delete";
import { FindManyBsdaFn } from "./bsda/findMany";
import { FindRelatedEntityFn } from "./bsda/findRelatedEntity";
import { FindUniqueBsdaFn } from "./bsda/findUnique";
import { UpdateBsdaFn } from "./bsda/update";
import { UpdateManyBsdaFn } from "./bsda/updateMany";
import { AcceptRevisionRequestApprovalFn } from "./revisionRequest/accept";
import { CancelRevisionRequestFn } from "./revisionRequest/cancel";
import { CountRevisionRequestFn } from "./revisionRequest/count";
import { CreateRevisionRequestFn } from "./revisionRequest/create";
import { FindManyBsdaRevisionRequestFn } from "./revisionRequest/findMany";
import { FindUniqueRevisionRequestFn } from "./revisionRequest/findUnique";
import { RefuseRevisionRequestApprovalFn } from "./revisionRequest/refuse";

export type BsdaActions = {
  findUnique: FindUniqueBsdaFn;
  findRelatedEntity: FindRelatedEntityFn;
  findMany: FindManyBsdaFn;
  create: CreateBsdaFn;
  update: UpdateBsdaFn;
  updateMany: UpdateManyBsdaFn;
  delete: DeleteBsdaFn;
  count: CountBsdasFn;

  countRevisionRequests: CountRevisionRequestFn;
  findUniqueRevisionRequest: FindUniqueRevisionRequestFn;
  findManyBsdaRevisionRequest: FindManyBsdaRevisionRequestFn;
  createRevisionRequest: CreateRevisionRequestFn;
  cancelRevisionRequest: CancelRevisionRequestFn;
  acceptRevisionRequestApproval: AcceptRevisionRequestApprovalFn;
  refuseRevisionRequestApproval: RefuseRevisionRequestApprovalFn;
};
