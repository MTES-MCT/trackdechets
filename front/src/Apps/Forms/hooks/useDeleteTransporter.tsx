import { BsdType } from "@td/codegen-ui";
import {
  DELETE_BSDA_TRANSPORTER,
  DELETE_FORM_TRANSPORTER
} from "../Components/query";
import { useMutation } from "@apollo/client";

export function useDeleteTransporter(bsdType: BsdType) {
  const gqlMutation =
    bsdType === BsdType.Bsda
      ? DELETE_BSDA_TRANSPORTER
      : DELETE_FORM_TRANSPORTER;

  return useMutation(gqlMutation);
}
