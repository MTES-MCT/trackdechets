import { BsdType } from "@td/codegen-ui";
import {
  DELETE_BSDA_TRANSPORTER,
  DELETE_BSFF_TRANSPORTER,
  DELETE_FORM_TRANSPORTER
} from "../Components/query";
import { useMutation } from "@apollo/client";

const mutations = {
  [BsdType.Bsda]: DELETE_BSDA_TRANSPORTER,
  [BsdType.Bsff]: DELETE_BSFF_TRANSPORTER,
  [BsdType.Bsdd]: DELETE_FORM_TRANSPORTER
};

export function useDeleteTransporter(bsdType: BsdType) {
  const gqlMutation = mutations[bsdType];
  return useMutation(gqlMutation);
}
