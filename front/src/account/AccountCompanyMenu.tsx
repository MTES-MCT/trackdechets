import React from "react";
import styles from "./AccountCompany.module.scss";
import { Link } from "./AccountCompany";

type Props = {
  links: Link[];
  activeLink: Link;
  setActiveLink: (link: Link) => void;
};

export default function AccountCompanyMenu({
  links,
  activeLink,
  setActiveLink
}: Props) {
  return (
    <div className={styles.menu}>
      {links.map((link, idx) => {
        return (
          <a
            key={idx}
            className={activeLink == link ? styles.active : ""}
            onClick={() => setActiveLink(link)}
          >
            {link}
          </a>
        );
      })}
    </div>
  );
}
