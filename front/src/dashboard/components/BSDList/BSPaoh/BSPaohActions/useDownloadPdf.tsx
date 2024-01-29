import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryBspaohPdfArgs } from "@td/codegen-ui";

export const BSPAOH_PDF = gql`
  query BspaohPdf($id: ID!) {
    bspaohPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "bspaohPdf">, QueryBspaohPdfArgs>
) {
  return useLazyQuery<Pick<Query, "bspaohPdf">, QueryBspaohPdfArgs>(
    BSPAOH_PDF,
    {
      ...options,
      fetchPolicy: "network-only",
      onCompleted: ({ bspaohPdf }) => {
        if (bspaohPdf.downloadLink == null) {
          return;
        }
        window.open(bspaohPdf.downloadLink, "_blank");
      }
    }
  );
}
