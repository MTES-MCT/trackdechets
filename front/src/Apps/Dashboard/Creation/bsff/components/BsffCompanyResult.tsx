import React, { useMemo } from "react";
import styles from "./scss/CompanyResult.module.scss";
import { CompanySearchResult } from "@td/codegen-ui";
import { generatePath } from "react-router-dom";

import classNames from "classnames";
import routes from "../../../../routes";
import {
  IconCheckCircle1,
  IconSignBadgeCircle,
  IconTrackDechetsCheck
} from "../../../../common/Components/Icons/Icons";

/**
 * Types
 */
export type CompanyResultBase = Pick<
  CompanySearchResult,
  | "siret"
  | "orgId"
  | "name"
  | "address"
  | "isRegistered"
  | "vatNumber"
  | "codePaysEtrangerEtablissement"
  | "etatAdministratif"
>;

interface CompanyResultsProps {
  results: CompanyResultBase[];
  selectedItem: CompanyResultBase | null;
  onSelect: (item: CompanyResultBase) => void;
  onUnselect?: () => void;
}

interface CompanyResultProps {
  item: CompanyResultBase;
  selectedItem: CompanyResultBase | null;
  onSelect: (item: CompanyResultBase) => void;
  onUnselect?: () => void;
}

/**
 * Utils
 */
export function isSelected(
  item: CompanyResultBase,
  selectedItem: CompanyResultBase | null
): boolean {
  return item.orgId === selectedItem?.orgId;
}

/**
 * List
 */
export default function BsffCompanyResults({
  results,
  selectedItem,
  onSelect,
  onUnselect
}: CompanyResultsProps) {
  const computedResults = useMemo(() => {
    if (selectedItem && !results.some(r => r.orgId === selectedItem.orgId)) {
      return [selectedItem, ...results];
    }
    return results;
  }, [results, selectedItem]);

  return (
    <ul className={styles.results}>
      {computedResults.map(item => (
        <CompanyResult
          key={item.orgId}
          item={item}
          selectedItem={selectedItem}
          onSelect={onSelect}
          onUnselect={onUnselect}
        />
      ))}
    </ul>
  );
}

/**
 * Item
 */
export function CompanyResult({
  item,
  selectedItem,
  onSelect,
  onUnselect
}: CompanyResultProps) {
  const selected = isSelected(item, selectedItem);
  const isClosedCompany = item.etatAdministratif === "F";

  return (
    <li
      className={classNames(styles.resultsItem, {
        [styles.isSelected]: selected,
        [styles.clickable]: !isClosedCompany
      })}
      onClick={() => {
        if (isClosedCompany) return;
        selected ? onUnselect?.() : onSelect(item);
      }}
    >
      <div className={styles.content}>
        <h6 className="tw-flex tw-items-center">
          <span>{item.name || "[Nom inconnu]"}</span>

          {item.isRegistered && (
            <span className="tw-ml-1">
              <IconTrackDechetsCheck />
            </span>
          )}

          {isClosedCompany && (
            <span className="tw-ml-2 tw-text-red-600">Établissement fermé</span>
          )}
        </h6>

        <p>
          {item.orgId} – {item.address || "[Adresse inconnue]"}
          {item.codePaysEtrangerEtablissement
            ? ` – ${item.codePaysEtrangerEtablissement}`
            : ""}
        </p>

        <p>
          <a
            href={generatePath(routes.company, { orgId: item.orgId })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="fr-link force-external-link-content force-underline-link"
          >
            Informations sur l’établissement
          </a>
        </p>
      </div>

      <div className={styles.icon}>
        {selected ? <IconCheckCircle1 /> : <IconSignBadgeCircle />}
      </div>
    </li>
  );
}
