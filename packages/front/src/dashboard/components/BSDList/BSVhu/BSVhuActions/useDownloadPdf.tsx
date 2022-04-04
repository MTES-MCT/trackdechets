import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryBsvhuPdfArgs } from "@trackdechets/codegen/src/front.gen";

export const BSVHU_PDF = gql`
  query Bsdasridf($id: ID) {
    bsvhuPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "bsvhuPdf">, QueryBsvhuPdfArgs>
) {
  return useLazyQuery<Pick<Query, "bsvhuPdf">, QueryBsvhuPdfArgs>(BSVHU_PDF, {
    ...options,
    fetchPolicy: "network-only",
    onCompleted: ({ bsvhuPdf }) => {
      if (bsvhuPdf.downloadLink == null) {
        return;
      }
      window.open(bsvhuPdf.downloadLink, "_blank");
    }
  });
}
