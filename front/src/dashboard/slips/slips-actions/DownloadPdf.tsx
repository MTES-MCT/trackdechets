import React from "react";
import { FaFilePdf } from "react-icons/fa";

type Props = { formId: string };

export default function DownloadPdf({ formId }: Props) {
  return (
    <a
      className="icon"
      href={`${process.env.REACT_APP_API_ENDPOINT}/pdf?id=${formId}`}
      target="_blank"
      title="Télécharger le PDF"
    >
      <FaFilePdf />
    </a>
  );
}
