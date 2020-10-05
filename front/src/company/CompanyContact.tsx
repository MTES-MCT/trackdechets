import React from "react";
import "./CompanyContact.scss";
import { CompanyPublic } from "src/generated/graphql/types";

type Props = {
  company: Pick<
    CompanyPublic,
    "address" | "contactEmail" | "contactPhone" | "website"
  >;
};

export default function CompanyContact({ company }: Props) {
  return (
    <div className="box" style={{ flex: "3" }}>
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
          {company.website ? (
            <a href={company.website} target="__blank">
              {company.website}
            </a>
          ) : (
            "Inconnu"
          )}
        </span>
      </div>
    </div>
  );
}
