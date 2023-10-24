import React from "react";
import { CompanySelectorItemProps } from "./companySelectorTypes";

import "./companySelector.scss";
import classNames from "classnames";
import routes from "Apps/routes";
import { generatePath } from "react-router-dom";

const tdIcon = (
  <svg
    width="23"
    height="23"
    viewBox="0 0 23 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.0056 2.56952C14.8667 1.2458 12.3231 0.735023 9.83893 1.13033C7.35474 1.52564 5.0954 2.80071 3.47296 4.72298C1.85051 6.64526 0.97306 9.08667 1.00063 11.602C1.0282 14.1173 1.95896 16.5389 3.62315 18.4251C5.28734 20.3114 7.57409 21.5366 10.0663 21.8774C12.5586 22.2181 15.0903 21.6517 17.1998 20.2814C19.3092 18.9111 20.8559 16.8283 21.5576 14.4127C22.2594 11.9971 22.0695 9.40977 21.0226 7.12252"
      stroke="#18753C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 5.16533L15.0271 8.07096C15.1105 8.19058 15.2196 8.28902 15.346 8.35871C15.4725 8.4284 15.6128 8.46749 15.7562 8.47297C15.8997 8.47844 16.0425 8.45016 16.1736 8.39031C16.3047 8.33045 16.4207 8.2406 16.5126 8.12767L21 2.47363"
      stroke="#18753C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.279 11.3346V10.1736H11.445V11.3346H9.501V16.4736H8.223V11.3346H6.279ZM10.8575 16.4736V10.1736H13.3325C15.3305 10.1736 16.6805 11.6226 16.6805 13.3236C16.6805 15.0246 15.3305 16.4736 13.3325 16.4736H10.8575ZM13.3505 11.3346H12.1355V15.3126H13.3505C14.5205 15.3126 15.3665 14.4396 15.3665 13.3236C15.3665 12.1986 14.5205 11.3346 13.3505 11.3346Z"
      fill="#18753C"
    />
  </svg>
);

const CompanySelectorItem = ({
  selected,
  onSelect,
  company,
  searchClue = "",
  postalCodeClue = "",
}: CompanySelectorItemProps) => {
  const formatCompanyInfo = () => {
    const highlight = (text, highlight) => {
      const parts = text.split(new RegExp(`(${highlight})`, "gi"));
      return (
        <span>
          {parts.map((part, i) => (
            <span
              key={i}
              style={
                part.toLowerCase() === highlight.toLowerCase()
                  ? { backgroundColor: "#B8FEC9" }
                  : {}
              }
            >
              {part}
            </span>
          ))}
        </span>
      );
    };

    const address = company.address ?? "[Adresse inconnue]";
    const countryCode = company.codePaysEtrangerEtablissement ?? "FR";

    return (
      <p>
        <b>{highlight(company.name, searchClue)}</b> -{" "}
        {highlight(company.orgId, searchClue)} -{" "}
        {highlight(address, postalCodeClue)} - {countryCode}{" "}
      </p>
    );
  };

  return (
    <div
      className={classNames("company-selector-item", {
        "company-selector-item__selected": selected,
      })}
      onClick={() => onSelect(company)}
    >
      <div className="company-selector-item__icon">
        {company.isRegistered ? tdIcon : null}
      </div>
      <div className="company-selector-item__content">
        <div className="company-selector-item__info">{formatCompanyInfo()}</div>
        <div className="company-selector-item__link">
          <a
            href={generatePath(routes.company, {
              orgId: company.orgId!,
            })}
            onClick={e => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="fr-link"
          >
            Lien vers la page entreprise
          </a>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectorItem;
