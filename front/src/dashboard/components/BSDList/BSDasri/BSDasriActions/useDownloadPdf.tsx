import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryBsdasriPdfArgs } from "generated/graphql/types";

export const BSDASRI_PDF = gql`
  query Bsdasridf($id: ID!) {
    bsdasriPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "bsdasriPdf">, QueryBsdasriPdfArgs>
) {
  return useLazyQuery<Pick<Query, "bsdasriPdf">, QueryBsdasriPdfArgs>(
    BSDASRI_PDF,
    {
      ...options,
      fetchPolicy: "network-only",
      onCompleted: ({ bsdasriPdf }) => {
        if (bsdasriPdf.downloadLink == null) {
          return;
        }
        window.open(bsdasriPdf.downloadLink, "_blank");
      },
    }
  );
}
