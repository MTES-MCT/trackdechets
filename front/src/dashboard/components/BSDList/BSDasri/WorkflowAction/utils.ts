import * as yup from "yup";

import { Bsdasri } from "generated/graphql/types";

import { gql } from "@apollo/client";

export const validationSchema = (form: Bsdasri) =>
  yup.object({
    author: yup.string().nullable().required("Le nom du signataire est requis"),
  });

export const SIGN_BSDASRI = gql`
  mutation SignBsdasri($id: ID!, $input: BsdasriSignatureInput!) {
    signBsdasri(id: $id, input: $input) {
      id
      status
    }
  }
`;
