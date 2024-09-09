import { CountFormsFn } from "./form/count";
import { CreateFormFn } from "./form/create";
import { DeleteFormFn } from "./form/delete";
import { DeleteFormStaleSegmentsFn } from "./form/deleteStaleSegments";
import { FindGroupedFormsByIdFn } from "./form/findGroupedFormsById";
import { FindFirstFormFn } from "./form/findFirst";
import { FindForwardedInByIdFn } from "./form/findForwardedInById";
import { FindFullFormByIdFn } from "./form/findFullFormById";
import { FindUniqueFormFn } from "./form/findUnique";
import { RemoveAppendix2Fn } from "./form/removeAppendix2";
import { SetAppendix1Fn } from "./form/setAppendix1";
import { SetAppendix2Fn } from "./form/setAppendix2";
import { UpdateFormFn } from "./form/update";
import { UpdateAppendix2Forms } from "./form/updateAppendix2Forms";
import { UpdateManyFormFn } from "./form/updateMany";
import { AcceptRevisionRequestApprovalFn } from "./formRevisionRequest/acceptRevisionRequestApproval";
import { CancelRevisionRequestFn } from "./formRevisionRequest/cancelRevisionRequest";
import { CountRevisionRequestsFn } from "./formRevisionRequest/countRevisionRequest";
import { CreateRevisionRequestFn } from "./formRevisionRequest/createRevisionRequest";
import { GetRevisionRequestByIdFn } from "./formRevisionRequest/getRevisionRequestById";
import { RefuseRevisionRequestFn } from "./formRevisionRequest/refuseRevisionRequestApproval";
import { UpdateAppendix1Forms } from "./form/updateAppendix1Forms";

export type FormActions = {
  findUnique: FindUniqueFormFn;
  findFirst: FindFirstFormFn;
  findFullFormById: FindFullFormByIdFn;
  findGroupedFormsById: FindGroupedFormsByIdFn;
  findForwardedInById: FindForwardedInByIdFn;
  create: CreateFormFn;
  update: UpdateFormFn;
  updateMany: UpdateManyFormFn;
  delete: DeleteFormFn;
  count: CountFormsFn;
  removeAppendix2: RemoveAppendix2Fn;
  setAppendix1: SetAppendix1Fn;
  setAppendix2: SetAppendix2Fn;
  updateAppendix1Forms: UpdateAppendix1Forms;
  deleteStaleSegments: DeleteFormStaleSegmentsFn;
};

export type FormRevisionRequestActions = {
  getRevisionRequestById: GetRevisionRequestByIdFn;
  cancelRevisionRequest: CancelRevisionRequestFn;
  createRevisionRequest: CreateRevisionRequestFn;
  acceptRevisionRequestApproval: AcceptRevisionRequestApprovalFn;
  refuseRevisionRequestApproval: RefuseRevisionRequestFn;
  countRevisionRequests: CountRevisionRequestsFn;
};
