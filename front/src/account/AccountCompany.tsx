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
  urlFiche: string;
};

export enum UserRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export type CompanyMember = {
  id: string;
  isMe: boolean;
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
  gerepId: string;
  users: [CompanyMember];
  contactEmail: string;
  contactPhone: string;
  website: string;
  givenName: string;
};

type Props = {
  company: Company;
};

export enum Link {
  Info = "Information",
  Security = "Sécurité",
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

  const isAdmin = company.userRole === UserRole.ADMIN;

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
    case Link.Security:
      activeContent = security;
      break;
    case Link.Members:
      activeContent = members;
      break;
    case Link.CompanyPage:
      activeContent = page;
      break;
  }

  const links = isAdmin
    ? [Link.Info, Link.Security, Link.Members, Link.CompanyPage]
    : [Link.Info, Link.Security, Link.CompanyPage];

  return (
    <div className={["panel", styles.company].join(" ")}>
      <div className={styles.title}>
        <h6>
          {company.name} ({company.siret})
        </h6>
        {isAdmin && (
          <h6 className={styles.admin}>
            Vous êtes administrateur
            <FaUserShield />
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
