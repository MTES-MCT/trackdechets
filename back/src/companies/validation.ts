import * as yup from "yup";
import validDatetime from "../common/yup/validDatetime";

export const receiptSchema = yup.object().shape({
  validityLimit: validDatetime({
    required: true,
    verboseFieldName: "Limite de validité"
  })
});
