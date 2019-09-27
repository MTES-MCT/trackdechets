import React from "react";
import "./CompanyContact.scss";

type Props = {
  address: string;
};

export default function CompanyContact(props: Props) {
  return (
    <div className="box" style={{ flex: "3" }}>
      <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>Contact</p>
      <div className="company__item">
        <label className="company__item-key">Adresse </label>
        <span className="company__item-value">{props.address}</span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Email</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          Inconnu
        </span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Téléphone</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          Inconnu
        </span>
      </div>
      <div className="company__item">
        <label className="company__item-key">Site internet</label>
        <span className="company__item-value" style={{ fontStyle: "italic" }}>
          Inconnu
        </span>
      </div>
    </div>
  );
}
