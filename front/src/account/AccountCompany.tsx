import React, { useState, ReactNode } from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountCompanyMenu from "./AccountCompanyMenu";
import AccountCompanyInfo from "./AccountCompanyInfo";
import AccountCompanySecurity from "./AccountCompanySecurity";
import AccountCompanyMemberList from "./AccountCompanyMemberList";
import AccountCompanyPage from "./AccountCompanyPage";
import styles from "./AccountCompany.module.scss";
import { FaUserShield } from "react-icons/fa";

type Installation = {
  codeS3ic: string;
  urlFiche: string;
};

export enum UserRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export type CompanyUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  isPendingInvitation: boolean;
};

export type Company = {
  name: string;
  siret: string;
  address: string;
  naf: string;
  libelleNaf: string;
  companyTypes: [string];
  installation: Installation;
  securityCode: number;
  userRole: string;
  users: [CompanyUser];
};

type Props = {
  company: Company;
};

export enum Link {
  info,
  security,
  members,
  company_page
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
    }
    ${AccountCompanyInfo.fragments.company}
    ${AccountCompanySecurity.fragments.company}
    ${AccountCompanyMemberList.fragments.company}
  `
};

export default function AccountCompany({ company }: Props) {
  const [activeLink, setActiveLink] = useState<Link>(Link.info);

  const info = (
    <AccountCompanyInfo
      company={filter(AccountCompanyInfo.fragments.company, company)}
    />
  );

  const security = (
    <AccountCompanySecurity
      company={filter(AccountCompanySecurity.fragments.company, company)}
    />
  );

  const members = (
    <AccountCompanyMemberList
      company={filter(AccountCompanyMemberList.fragments.company, company)}
    />
  );

  const page = <AccountCompanyPage />;

  let activeContent: ReactNode = null;

  switch (activeLink) {
    case Link.info:
      activeContent = info;
      break;
    case Link.security:
      activeContent = security;
      break;
    case Link.members:
      activeContent = members;
      break;
    case Link.company_page:
      activeContent = page;
      break;
  }

  return (
    <div className={["panel", styles.company].join(" ")}>
      <div className={styles.title}>
        <h6>
          {company.name} ({company.siret})
        </h6>
        {company.userRole == UserRole.ADMIN && (
          <h6 className={styles.admin}>
            Vous êtes administrateur
            <FaUserShield />
          </h6>
        )}
      </div>

      <AccountCompanyMenu
        activeLink={activeLink}
        setActiveLink={(link: Link) => setActiveLink(link)}
      />
      {activeContent}
    </div>
  );
}
