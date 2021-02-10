import * as yup from "yup";

export const receiptSchema = yup.object().shape({
  validityLimit: yup
    .date()
    .typeError("La limite de validité n'est pas formatée correctement")
    .required()
});
