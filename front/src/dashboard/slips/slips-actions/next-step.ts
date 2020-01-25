import { Form } from "../../../form/model";
import { Me } from "../../../login/model";

export enum SlipTabs {
  DRAFTS,
  TO_SIGN,
  STATUS,
  HISTORY
}

enum FormStatus {
  DRAFT = "DRAFT",
  SEALED = "SEALED",
  SENT = "SENT",
  NO_TRACEABILITY = "NO_TRACEABILITY",
  PROCESSED = "PROCESSED",
  RECEIVED = "RECEIVED",
  REFUSED = "REFUSED"
}

export function getTabForms(tab: SlipTabs, forms: Form[], currentUser: Me) {
  switch (tab) {
    case SlipTabs.DRAFTS:
      return forms
        .filter((f: Form) => isDraftStatus(f.status))
        .sort((a: any, b: any) => a.createdAt - b.createdAt);
    case SlipTabs.TO_SIGN:
      return forms
        .filter(
          (f: Form) =>
            !isDraftStatus(f.status) && getNextStep(f, currentUser) != null
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
            getNextStep(f, currentUser) == null
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
          // filter from whose status is   PROCESSED|NO_TRACEABILITY|REFUSED
          .filter((f: Form) => isHistoryStatus(f.status))
          .sort((a: any, b: any) => a.createdAt - b.createdAt)
      );
  }
}

export function getNextStep(form: Form, currentUser: Me) {
  const currentUserIsEmitter =
    currentUser.companies
      .map(c => c.siret)
      .indexOf(form.emitter.company.siret) > -1;
  const currentUserIsRecipient =
    currentUser.companies
      .map(c => c.siret)
      .indexOf(form.recipient.company.siret) > -1;

  if (form.status === FormStatus.DRAFT) return FormStatus.SEALED;

  if (currentUserIsEmitter) {
    if (form.status === FormStatus.SEALED) return FormStatus.SENT;
    if (!currentUserIsRecipient) return null;
  }

  if (form.status === FormStatus.SENT) return FormStatus.RECEIVED;
  if (form.status === FormStatus.RECEIVED) return FormStatus.PROCESSED;
  return null;
}

function isDraftStatus(status: string) {
  return status === FormStatus.DRAFT;
}

function isHistoryStatus(status: string) {
  return [
    FormStatus.PROCESSED,
    FormStatus.NO_TRACEABILITY,
    FormStatus.REFUSED
  ].includes(status as FormStatus);
}
