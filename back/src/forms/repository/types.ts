import { Prisma } from "@prisma/client";
import { CountFormsFn } from "./form/count";
import { CreateFormFn } from "./form/create";
import { DeleteFormFn } from "./form/delete";
import { DeleteFormStaleSegmentsFn } from "./form/deleteStaleSegments";
import { FindAppendix2FormsByIdFn } from "./form/findAppendix2FormsById";
import { FindForwardedInByIdFn } from "./form/findForwardedInById";
import { FindFullFormByIdFn } from "./form/findFullFormById";
import { FindUniqueFormFn } from "./form/findUnique";
import { RemoveAppendix2Fn } from "./form/removeAppendix2";
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

const formWithLinkedObjects = Prisma.validator<Prisma.FormArgs>()({
  include: {
    forwardedIn: true,
    transportSegments: true,
    intermediaries: true
  }
});

export type FullForm = Prisma.FormGetPayload<typeof formWithLinkedObjects>;

export type FormActions = {
  findUnique: FindUniqueFormFn;
  findFullFormById: FindFullFormByIdFn;
  findAppendix2FormsById: FindAppendix2FormsByIdFn;
  findForwardedInById: FindForwardedInByIdFn;
  create: CreateFormFn;
  update: UpdateFormFn;
  updateMany: UpdateManyFormFn;
  delete: DeleteFormFn;
  count: CountFormsFn;
  removeAppendix2: RemoveAppendix2Fn;
  setAppendix2: SetAppendix2Fn;
  updateAppendix2Forms: UpdateAppendix2Forms;
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
