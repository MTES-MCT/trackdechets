import React from "react";
import styles from "./AccountCompany.module.scss";
import { Link } from "./AccountCompany";

type Props = {
  activeLink: Link;
  setActiveLink: (link: Link) => void;
};

export default function AccountCompanyMenu({
  activeLink,
  setActiveLink
}: Props) {
  return (
    <div className={styles.menu}>
      <a
        className={activeLink == Link.info ? styles.active : ""}
        onClick={() => setActiveLink(Link.info)}
      >
        Info
      </a>
      <a
        className={activeLink == Link.security ? styles.active : ""}
        onClick={() => setActiveLink(Link.security)}
      >
        Sécurité
      </a>
      <a
        className={activeLink == Link.members ? styles.active : ""}
        onClick={() => setActiveLink(Link.members)}
      >
        Membres
      </a>
      <a
        className={activeLink == Link.company_page ? styles.active : ""}
        onClick={() => setActiveLink(Link.company_page)}
      >
        Fiche entreprise
      </a>
    </div>
  );
}
