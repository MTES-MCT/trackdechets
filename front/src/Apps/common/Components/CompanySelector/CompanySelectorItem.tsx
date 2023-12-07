import React, { ReactNode, useMemo } from "react";
import { CompanySelectorItemProps } from "./companySelectorTypes";

import "./companySelector.scss";
import classNames from "classnames";
import routes from "../../../../Apps/routes";
import { generatePath } from "react-router-dom";
import { IconTDCompany } from "../Icons/Icons";

function highlight(text: string, highlight: string): ReactNode {
  if (highlight?.length > 0) {
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
  }
  return text;
}

const CompanySelectorItem = ({
  selected,
  selectedError,
  onSelect,
  company,
  searchClue = "",
  postalCodeClue = ""
}: CompanySelectorItemProps) => {
  const name = company.name ?? "[Raison sociale inconnue]";
  const address = company.address ?? "[Adresse inconnue]";
  const countryCode = company.codePaysEtrangerEtablissement ?? "FR";

  const handleClick = () => {
    onSelect(company);
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      handleClick();
    }
  };

  const highlightedName = useMemo(
    () => (selected ? name : highlight(name, searchClue)),
    [selected, name, searchClue]
  );
  const highlightedOrgId = useMemo(
    () => (selected ? company.orgId : highlight(company.orgId, searchClue)),
    [selected, company.orgId, searchClue]
  );
  const highlightedAdress = useMemo(
    () => (selected ? address : highlight(address, postalCodeClue)),
    [selected, address, postalCodeClue]
  );

  return (
    <>
      <div
        className={classNames("company-selector-item", {
          "company-selector-item__selected": selected,
          "company-selector-item__selected__error": Boolean(selectedError)
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
          <div className="company-selector-item__info">
            <p>
              <b>{highlightedName}</b> - {highlightedOrgId} -{" "}
              {highlightedAdress} - {countryCode}
            </p>
          </div>
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
      {selectedError ? (
        <div className="fr-error-text">{selectedError}</div>
      ) : null}
    </>
  );
};

export default CompanySelectorItem;
