import React from "react";
import "./CompanyContact.scss";
import { CompanySearchResult } from "codegen-ui";

type Props = {
  company: Pick<
    CompanySearchResult,
    | "address"
    | "contactEmail"
    | "contactPhone"
    | "website"
    | "ecoOrganismeAgreements"
  >;
};

export default function CompanyContact({ company }: Props) {
  if (!company) return <div></div>;
  return (
    <div className="box" style={{ flex: "1 1 auto" }}>
      <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>Contact</p>
      <div className="company__item">
        <label className="company__item-key">Adresse </label>
        <span className="company__item-value">{company.address}</span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Email</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          {company.contactEmail ? company.contactEmail : "Inconnu"}
        </span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Téléphone</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          {company.contactPhone ? company.contactPhone : "Inconnu"}
        </span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Site internet</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          {company.website ? company.website : "Inconnu"}
        </span>
      </div>
      {company.ecoOrganismeAgreements &&
        company.ecoOrganismeAgreements.length > 0 && (
          <>
            <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>
              Agrément(s) éco-organisme
            </p>
            <div className="company__item">
              <ul className="tw-list-disc tw-list-inside">
                {company.ecoOrganismeAgreements.map((agreement, index) => (
                  <li key={index} className="url-ellipsis">
                    <a
                      href={agreement}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {agreement}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
    </div>
  );
}
