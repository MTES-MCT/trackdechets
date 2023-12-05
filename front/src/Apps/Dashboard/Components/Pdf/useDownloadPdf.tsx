import { gql, LazyQueryHookOptions, useLazyQuery } from "@apollo/client";
import { PDF_BSFF_FORM } from "../../../../form/bsff/utils/queries";
import {
  Query,
  QueryBsdaPdfArgs,
  QueryBsdasriPdfArgs,
  QueryBsffPdfArgs,
  QueryBsvhuPdfArgs,
  QueryFormPdfArgs
} from "codegen-ui";

const FORMS_PDF = gql`
  query FormPdf($id: ID!) {
    formPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

const BSDA_PDF = gql`
  query BsdaPdf($id: ID!) {
    bsdaPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

const BSDASRI_PDF = gql`
  query BsdasriPdf($id: ID!) {
    bsdasriPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

const BSVHU_PDF = gql`
  query BsvhuPdf($id: ID!) {
    bsvhuPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export function useBsddDownloadPdf(
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

export function useBsdaDownloadPdf(
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

export function useBsdasriDownloadPdf(
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
      }
    }
  );
}

export function useBsffDownloadPdf(
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

export function useBsvhuDownloadPdf(
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
