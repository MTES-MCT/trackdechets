import React from "react";
import {
  IconCheckCircle1,
  IconTrackDechetsCheck,
  IconSignBadgeCircle,
} from "common/components/Icons";
import styles from "./CompanyResult.module.scss";
import { CompanySearchResult } from "../../../../generated/graphql/types";
import { generatePath } from "react-router-dom";
import routes from "common/routes";
import classNames from "classnames";

interface CompanyResultsProps<T> {
  results: T[];
  onSelect: (item: T) => void;
  onUnselect?: () => void;
  selectedItem: T | null;
}

type CompanyResultBase = Pick<
  CompanySearchResult,
  | "siret"
  | "orgId"
  | "name"
  | "address"
  | "isRegistered"
  | "vatNumber"
  | "codePaysEtrangerEtablissement"
>;

export function isSelected<T extends CompanyResultBase>(
  item: T,
  selectedItem: T | null
): boolean {
  return (
    item.siret === selectedItem?.siret || item.orgId === selectedItem?.orgId
  );
}

export default function CompanyResults<T extends CompanyResultBase>({
  results,
  onSelect,
  onUnselect,
  selectedItem,
}: CompanyResultsProps<T>) {
  // prepend selectedItem if it's not in the results
  if (
    selectedItem &&
    (selectedItem.siret || selectedItem.orgId) &&
    !results.some(result => isSelected(result, selectedItem))
  ) {
    results.unshift(selectedItem);
  }

  return (
    <ul className={styles.results}>
      {results.map(item => (
        <CompanyResult
          key={item.orgId ?? item.siret!}
          item={item}
          selectedItem={selectedItem}
          onSelect={onSelect}
          onUnselect={onUnselect}
        />
      ))}
    </ul>
  );
}
interface CompanyResultProp<T> {
  item: T;
  onSelect: (item: T) => void;
  onUnselect?: () => void;
  selectedItem: T | null;
}
export function CompanyResult<T extends CompanyResultBase>({
  item,
  selectedItem,
  onSelect,
  onUnselect,
}: CompanyResultProp<T>) {
  return (
    <li
      key={item.siret ?? item.vatNumber!}
      className={classNames(styles.resultsItem, {
        [styles.isSelected]: isSelected(item, selectedItem),
      })}
      onClick={() =>
        isSelected(item, selectedItem) ? onUnselect?.() : onSelect(item)
      }
    >
      <div className={styles.content}>
        <h6 className="tw-flex tw-items-center tw-align-middle">
          <div className="tw-mt-1">
            {item.name ? item.name : "[Nom inconnu]"}
          </div>
          {item.isRegistered === true && (
            <div className="tw-ml-1">
              <IconTrackDechetsCheck />
            </div>
          )}
        </h6>
        <p>
          {item.orgId ?? item.siret!} -{" "}
          {item.address ? item.address : "[Adresse inconnue]"}
          {item.codePaysEtrangerEtablissement
            ? ` - ${item.codePaysEtrangerEtablissement}`
            : ""}
        </p>
        <p>
          <a
            href={generatePath(routes.company, {
              orgId: item.orgId ?? item.siret!,
            })}
            onClick={e => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Informations sur l'entreprise
          </a>
        </p>
      </div>
      <div className={styles.icon}>
        {isSelected(item, selectedItem) ? (
          <IconCheckCircle1 />
        ) : (
          <IconSignBadgeCircle />
        )}
      </div>
    </li>
  );
}
