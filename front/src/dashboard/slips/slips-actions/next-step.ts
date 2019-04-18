import { Form } from "../../../form/model";
import { Me } from "../../../login/model";

export enum SlipTabs {
  DRAFTS,
  TO_SIGN,
  STATUS,
  HISTORY
}

export function getTabForms(tab: SlipTabs, forms: Form[], currentUser: Me) {
  switch (tab) {
    case SlipTabs.DRAFTS:
      return forms
        .filter((f: Form) => f.status === "DRAFT")
        .sort((a: any, b: any) => a.createdAt - b.createdAt);
    case SlipTabs.TO_SIGN:
      return forms
        .filter(
          (f: Form) =>
            f.status !== "DRAFT" && getNextStep(f, currentUser) != null
        )
        .sort((a: any, b: any) =>
          a.status > b.status
            ? 1
            : a.status === b.status
            ? a.createdAt - b.createdAt
            : -1
        );
    case SlipTabs.STATUS:
      return forms
        .filter(
          (f: Form) =>
            f.status !== "DRAFT" &&
            f.status !== "PROCESSED" &&
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
      return forms
        .filter(
          (f: Form) => ["PROCESSED", "NO_TRACEABILITY"].indexOf(f.status) !== -1
        )
        .sort((a: any, b: any) => a.createdAt - b.createdAt);
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

  if (form.status === "DRAFT") return "SEALED";

  if (currentUserIsEmitter) {
    if (form.status === "SEALED") return "SENT";
    if (!currentUserIsRecipient) return null;
  }

  if (form.status === "SENT") return "RECEIVED";
  if (form.status === "RECEIVED") return "PROCESSED";
  return null;
}
