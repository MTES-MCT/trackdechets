import React from "react";
import { CompanySelectorItemProps } from "./companySelectorTypes";

import "./companySelector.scss";
import classNames from "classnames";
import routes from "../../../../Apps/routes";
import { generatePath } from "react-router-dom";
import { IconTDCompany } from "../Icons/Icons";

const CompanySelectorItem = ({
  selected,
  onSelect,
  company,
  searchClue = "",
  postalCodeClue = ""
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

  const handleClick = () => {
    onSelect(company);
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      handleClick();
    }
  };

  return (
    <div
      className={classNames("company-selector-item", {
        "company-selector-item__selected": selected
      })}
      role={"button"}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="company-selector-item__icon">
        {company.isRegistered ? <IconTDCompany /> : null}
      </div>
      <div className="company-selector-item__content">
        <div className="company-selector-item__info">{formatCompanyInfo()}</div>
        <div className="company-selector-item__link">
          <a
            href={generatePath(routes.company, {
              orgId: company.orgId!
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
