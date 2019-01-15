import { Form } from "../../../form/model";
import { Me } from "../../../login/model";

export function getNextStep(form: Form, currentUser: Me) {
  const currentUserIsEmitter =
    form.emitter.company.siret === currentUser.company.siret;

  if (form.status === "DRAFT") return "SEALED";

  if (currentUserIsEmitter) {
    if (form.status === "SEALED") return "SENT";
    return null;
  }

  if (form.status === "SENT") return "RECEIVED";
  if (form.status === "RECEIVED") return "PROCESSED";
  return null;
}
