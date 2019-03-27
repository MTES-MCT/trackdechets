import { Form } from "../../../form/model";
import { Me } from "../../../login/model";

export function getNextStep(form: Form, currentUser: Me) {
  const currentUserIsEmitter =
    currentUser.companies
      .map(c => c.siret)
      .indexOf(form.emitter.company.siret) > -1;

  if (form.status === "DRAFT") return "SEALED";

  if (currentUserIsEmitter) {
    if (form.status === "SEALED") return "SENT";
    return null;
  }

  if (form.status === "SENT") return "RECEIVED";
  if (form.status === "RECEIVED") return "PROCESSED";
  return null;
}
