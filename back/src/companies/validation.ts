import * as yup from "yup";

export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().required()
});
