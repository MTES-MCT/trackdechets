import { LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { Query, QueryBsvhuPdfArgs } from "@td/codegen-ui";
import { BSVHU_PDF } from "../../../../../Apps/common/queries/bsvhu/queries";

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
