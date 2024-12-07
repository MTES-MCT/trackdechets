import { Form, FormResolvers } from "@td/codegen-back";
import { bsddWasteQuantities } from "../../helpers/bsddWasteQuantities";

const getWasteQuantityAccepted = (form: Form) => {
  const res = bsddWasteQuantities(form);
  return res?.quantityAccepted?.toNumber() ?? null;
};

export const wasteQuantityAcceptedResolver: FormResolvers["quantityAccepted"] =
  form => getWasteQuantityAccepted(form);

const getWasteQuantityRefused = (form: Form) => {
  const res = bsddWasteQuantities(form);
  return res?.quantityRefused?.toNumber() ?? null;
};

export const wasteQuantityRefusedResolver: FormResolvers["quantityRefused"] =
  form => getWasteQuantityRefused(form);
