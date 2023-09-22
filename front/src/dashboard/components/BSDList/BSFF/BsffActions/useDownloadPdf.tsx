import { LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { PDF_BSFF_FORM } from "../../../../../form/bsff/utils/queries";
import { Query, QueryBsffPdfArgs } from "codegen-ui";

export function useDownloadPdf(
  options: LazyQueryHookOptions<Pick<Query, "bsffPdf">, QueryBsffPdfArgs>
) {
  return useLazyQuery<Pick<Query, "bsffPdf">, QueryBsffPdfArgs>(PDF_BSFF_FORM, {
    ...options,
    fetchPolicy: "network-only",
    onCompleted: ({ bsffPdf }) => {
      if (bsffPdf.downloadLink == null) {
        return;
      }
      window.open(bsffPdf.downloadLink, "_blank");
    }
  });
}
