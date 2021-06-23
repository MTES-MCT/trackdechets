import React, { useState, ReactNode } from "react";
import { gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import { IconPasswordKey } from "common/components/Icons";
import AccountCompanyMenu from "./AccountCompanyMenu";
import AccountCompanyInfo from "./AccountCompanyInfo";
import AccountCompanySecurity from "./AccountCompanySecurity";
import AccountCompanyMemberList from "./AccountCompanyMemberList";
import AccountCompanyPage from "./AccountCompanyPage";
import styles from "./AccountCompany.module.scss";
import { CompanyPrivate, UserRole } from "generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

export enum Link {
  Info = "Information",
  Signature = "Signature",
  Members = "Membres",
  CompanyPage = "Fiche Entreprise",
}

AccountCompany.fragments = {
  company: gql`
    fragment AccountCompanyFragment on CompanyPrivate {
      id
      name
      siret
      userRole
      ...AccountCompanyInfoFragment
      ...AccountCompanySecurityFragment
      ...AccountCompanyMemberListFragment
      ...AccountCompanyPageFragment
    }
    ${AccountCompanyInfo.fragments.company}
    ${AccountCompanySecurity.fragments.company}
    ${AccountCompanyMemberList.fragments.company}
    ${AccountCompanyPage.fragments.company}
  `,
};

export default function AccountCompany({ company }: Props) {
  const [activeLink, setActiveLink] = useState<Link>(Link.Info);

  const isAdmin = company.userRole === UserRole.Admin;

  const info = (
    <AccountCompanyInfo
      company={filter(AccountCompanyInfo.fragments.company, company)}
    />
  );

  const signature = (
    <AccountCompanySecurity
      company={filter(AccountCompanySecurity.fragments.company, company)}
    />
  );

  const members = (
    <AccountCompanyMemberList
      company={filter(AccountCompanyMemberList.fragments.company, company)}
    />
  );

  const page = (
    <AccountCompanyPage
      company={filter(AccountCompanyPage.fragments.company, company)}
    />
  );

  let activeContent: ReactNode = null;

  switch (activeLink) {
    case Link.Info:
      activeContent = info;
      break;
    case Link.Signature:
      activeContent = signature;
      break;
    case Link.Members:
      activeContent = members;
      break;
    case Link.CompanyPage:
      activeContent = page;
      break;
  }

  const links = isAdmin
    ? [Link.Info, Link.Signature, Link.Members, Link.CompanyPage]
    : [Link.Info, Link.Signature, Link.CompanyPage];

  return (
    <div className={["panel", styles.company].join(" ")}>
      <div className={styles.title}>
        <h6>
          {company.name} ({company.siret})
        </h6>
        {isAdmin && (
          <h6 className={styles.admin}>
            Vous êtes administrateur
            <IconPasswordKey />
          </h6>
        )}
      </div>

      <AccountCompanyMenu
        links={links}
        activeLink={activeLink}
        setActiveLink={(link: Link) => setActiveLink(link)}
      />
      {activeContent}
    </div>
  );
}
