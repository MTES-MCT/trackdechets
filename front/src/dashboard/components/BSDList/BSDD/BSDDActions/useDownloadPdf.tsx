import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryFormPdfArgs } from "@td/codegen-ui";

export const FORMS_PDF = gql`
  query FormPdf($id: ID!) {
    formPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "formPdf">, QueryFormPdfArgs>
) {
  return useLazyQuery<Pick<Query, "formPdf">, QueryFormPdfArgs>(FORMS_PDF, {
    ...options,
    fetchPolicy: "network-only",
    onCompleted: ({ formPdf }) => {
      if (formPdf.downloadLink == null) {
        return;
      }
      window.open(formPdf.downloadLink, "_blank");
    }
  });
}
