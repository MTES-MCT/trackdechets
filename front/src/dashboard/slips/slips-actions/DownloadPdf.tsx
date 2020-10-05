import React from "react";

import { PdfIcon } from "src/common/components/Icons";
import DownloadFileLink from "src/common/components/DownloadFileLink";
import gql from "graphql-tag";
import {COLORS} from "src/common/config"
type Props = { formId: string; small?: boolean; onSuccess?: () => void; };

export const FORMS_PDF = gql`
  query FormPdf($id: ID) {
    formPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export default function DownloadPdf({ formId, onSuccess, small=true }: Props) {
  const className =  small ?"btn--no-style slips-actions__button" : "btn btn--outline-primary";

  return (
    <DownloadFileLink
      query={FORMS_PDF}
      params={{ id: formId }}
      title="Télécharger le PDF"
      className={className}
      onSuccess={onSuccess}
    >
      <PdfIcon size={24} color={COLORS.blueLight} />
      <span>Pdf</span>
    </DownloadFileLink>
  );
}
