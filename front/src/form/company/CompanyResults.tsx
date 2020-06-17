import React from "react";
import { FaCheck, FaRegCircle } from "react-icons/fa";
import styles from "./CompanyResult.module.scss";

export default function CompanyResults({ results, onSelect, selectedItem }) {
  return (
    <ul className={styles.results}>
      {results.map(item => (
        <li
          className={`${styles.resultsItem}  ${
            selectedItem?.siret === item.siret ? styles.isSelected : ""
          }`}
          key={item.siret}
          onClick={() => onSelect(item)}
        >
          <div className={styles.content}>
            <h6>{item.name}</h6>
            <p>
              {item.siret} - {item.address}
            </p>
            <p>
              <a
                href={`/company/${item.siret}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Information sur l'entreprise
              </a>
            </p>
          </div>
          <div className={styles.icon}>
            {selectedItem?.siret === item.siret ? <FaCheck /> : <FaRegCircle />}
          </div>
        </li>
      ))}
    </ul>
  );
}
