import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryBsdaPdfArgs } from "@td/codegen-ui";

export const BSDA_PDF = gql`
  query Bsdasridf($id: ID!) {
    bsdaPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "bsdaPdf">, QueryBsdaPdfArgs>
) {
  return useLazyQuery<Pick<Query, "bsdaPdf">, QueryBsdaPdfArgs>(BSDA_PDF, {
    ...options,
    fetchPolicy: "network-only",
    onCompleted: ({ bsdaPdf }) => {
      if (bsdaPdf.downloadLink == null) {
        return;
      }
      window.open(bsdaPdf.downloadLink, "_blank");
    }
  });
}
