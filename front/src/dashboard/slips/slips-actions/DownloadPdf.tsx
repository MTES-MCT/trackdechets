import React from "react";
import { FaFilePdf } from "react-icons/fa";
import DownloadFileLink from "../../../common/DownloadFileLink";
import gql from "graphql-tag";

type Props = { formId: string };

export const FORMS_PDF = gql`
  query FormPdf($id: ID) {
    formPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

export default function DownloadPdf({ formId }: Props) {
  return (
    <DownloadFileLink
      query={FORMS_PDF}
      params={{ id: formId }}
      title="Télécharger le PDF"
    >
      <FaFilePdf />
    </DownloadFileLink>
  );
}
