import { Form, FormStatus } from "generated/graphql/types";

export enum SlipTabs {
  DRAFTS,
  TO_SIGN,
  STATUS,
  HISTORY,
}

export function getTabForms(
  tab: SlipTabs,
  forms: Form[],
  currentSiret: string
) {
  switch (tab) {
    case SlipTabs.DRAFTS:
      return forms
        .filter((f: Form) => isDraftStatus(f.status))
        .sort((a: any, b: any) => a.createdAt - b.createdAt);
    case SlipTabs.TO_SIGN:
      return forms
        .filter(
          (f: Form) =>
            !isDraftStatus(f.status) && getNextStep(f, currentSiret) != null
        )
        .sort((a: any, b: any) =>
          a.status > b.status
            ? 1
            : a.status === b.status
            ? a.createdAt - b.createdAt
            : -1
        );
    case SlipTabs.STATUS:
      // filter from whose status is not DRAFT|PROCESSED|NO_TRACEABILITY|REFUSED and from which there is no next step for current user
      return forms
        .filter(
          (f: Form) =>
            !isDraftStatus(f.status) &&
            !isHistoryStatus(f.status) &&
            getNextStep(f, currentSiret) == null
        )
        .sort((a: any, b: any) =>
          a.status > b.status
            ? 1
            : a.status === b.status
            ? a.createdAt - b.createdAt
            : -1
        );
    case SlipTabs.HISTORY:
      return (
        forms
          // filter from whose status is PROCESSED|NO_TRACEABILITY|REFUSED
          .filter((f: Form) => isHistoryStatus(f.status))
          .sort((a: any, b: any) => a.createdAt - b.createdAt)
      );
  }
}

export function getNextStep(form: Form, currentSiret: string) {
  const currentUserIsRecipient =
    currentSiret === form.recipient?.company?.siret;
  const currentUserIsTempStorer =
    currentUserIsRecipient && form.recipient?.isTempStorage;
  const currentUserIsDestination =
    currentSiret === form.temporaryStorageDetail?.destination?.company?.siret;

  if (form.status === FormStatus.Draft) return FormStatus.Sealed;

  if (currentUserIsDestination) {
    if (form.status === FormStatus.Resent) return FormStatus.Received;
    if (form.status === FormStatus.Received) return FormStatus.Accepted;
    if (form.status === FormStatus.Accepted) return FormStatus.Processed;
  }

  if (currentUserIsTempStorer) {
    if (form.status === FormStatus.Sent) return FormStatus.TempStored;
    if (form.status === FormStatus.TempStored) return FormStatus.TempStorerAccepted;
    if (form.status === FormStatus.TempStorerAccepted) return FormStatus.Resealed;
    return null;
  }

  if (currentUserIsRecipient) {
    if (
      form.status === FormStatus.Sent &&
      form.temporaryStorageDetail?.temporaryStorer == null
    )
      return FormStatus.Received;
    if (form.status === FormStatus.Received) return FormStatus.Accepted;
    if (form.status === FormStatus.Accepted) return FormStatus.Processed;
  }

  return null;
}

function isDraftStatus(status: string) {
  return status === FormStatus.Draft;
}

function isHistoryStatus(status: string) {
  return [
    FormStatus.Processed,
    FormStatus.NoTraceability,
    FormStatus.Refused,
  ].includes(status as FormStatus);
}
