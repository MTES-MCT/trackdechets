import * as React from "react";
import { extractPostalCodeFromAddress } from "../../Apps/utils/utils";
import styles from "./AnonymousCompany.module.scss";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";

const openDataSoftUrl = (postalCode: string): string => {
  return `https://public.opendatasoft.com/explore/dataset/correspondance-code-insee-code-postal/table/?flg=fr-fr&q=${postalCode}`;
};

const googleUrl = (postalCode: string): string => {
  return `https://www.google.com/search?q=%22code+commune%22+${postalCode}`;
};

const buildLink = (href: string, label: string): JSX.IntrinsicElements["a"] => {
  return (
    <a
      className={`fr-link ${styles.blueFrance} force-external-link-content force-underline-link`}
      rel="noopener noreferrer"
      href={href}
      target="_blank"
    >
      {label}
    </a>
  );
};

export const CodeCommuneLinks = ({ address }: { address?: string | null }) => {
  if (!address) return null;

  const postalCode = extractPostalCodeFromAddress(address);

  if (!postalCode) return null;

  const openDataSoftLink = buildLink(
    openDataSoftUrl(postalCode),
    "OpenDataSoft"
  );
  const googleLink = buildLink(googleUrl(postalCode), "Google");

  if (postalCode) {
    return (
      <>
        Vérifier sur {openDataSoftLink} ou sur {googleLink}
      </>
    );
  }

  return null;
};
