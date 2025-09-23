import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import Badge from "@codegouvfr/react-dsfr/Badge";
import CompanyInfo from "./CompanyInfo/CompanyInfo";
import CompanyContactForm from "./CompanyContact/CompanyContactForm";
import CompanyAdvanced from "./CompanyAdvanced/CompanyAdvanced";
import {
  Query,
  QueryMyCompaniesArgs,
  UserRole,
  CompanyPrivate
} from "@td/codegen-ui";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { userRole } from "./CompaniesList/CompaniesList";
import { MY_COMPANIES } from "./common/queries";
import { Loader } from "../common/Components";
import { NotificationError } from "../common/Components/Error/Error";
import routes from "../routes";
import AccountContentWrapper from "../Account/AccountContentWrapper";
import CompanySignature from "./CompanySignature/CompanySignature";
import CompanyMembers from "./CompanyMembers/CompanyMembers";
import CompanyDigestSheetForm from "./CompanyDigestSheet/CompanyDigestSheet";
import { Tabs, TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import { FrIconClassName } from "@codegouvfr/react-dsfr";
import { CompanyRegistry } from "./CompanyRegistry/CompanyRegistry";

export type TabContentProps = {
  company: CompanyPrivate;
};

const buildTabs = (
  company: CompanyPrivate
): {
  tabs: TabsProps.Controlled["tabs"];
  tabsContent: Record<string, React.FC<TabContentProps>>;
} => {
  const isAdmin = company.userRole === UserRole.Admin;

  const iconId = "fr-icon-checkbox-line" as FrIconClassName;
  const tabs = [
    {
      tabId: "informations",
      label: "Informations",
      iconId
    },
    {
      tabId: "signature",
      label: "Signature",
      iconId
    },
    {
      tabId: "membres",
      label: "Membres",
      iconId
    },
    {
      tabId: "contact",
      label: "Contact",
      iconId
    },
    {
      tabId: "fiche",
      label: "Fiche",
      iconId
    },
    {
      tabId: "registry",
      label: "Registre national",
      iconId
    }
  ];
  const tabsContent = {
    informations: CompanyInfo,
    signature: CompanySignature,
    membres: CompanyMembers,
    contact: CompanyContactForm,
    fiche: CompanyDigestSheetForm,
    registry: CompanyRegistry
  };
  if (isAdmin) {
    tabs.push({
      tabId: "avance",
      label: "Avancé",
      iconId
    });
    tabsContent["avance"] = CompanyAdvanced;
  }

  return { tabs, tabsContent };
};

const Dummy = () => <p></p>;

export default function CompanyDetails() {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();
  const [selectedTabId, setSelectedTabId] = useState(
    [
      "informations",
      "signature",
      "membres",
      "contact",
      "fiche",
      "registry",
      "avance"
    ].includes(location.hash.substring(1))
      ? location.hash.substring(1)
      : "informations"
  );

  useEffect(() => {
    window.location.replace(`#${selectedTabId}`);
  }, [selectedTabId]);

  const { data, loading, error } = useQuery<
    Pick<Query, "myCompanies">,
    QueryMyCompaniesArgs
  >(MY_COMPANIES, {
    fetchPolicy: "network-only",
    variables: { search: siret }
  });

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (loading) {
    return <Loader />;
  }

  const companies = data?.myCompanies?.edges.map(({ node }) => node);
  const company = companies ? companies.find(c => c.siret === siret) : null;

  if (!company) {
    return <Navigate to={{ pathname: routes.companies.index }} />;
  }

  const { tabs, tabsContent } = buildTabs(company);

  let CurrentComponent = tabsContent[selectedTabId];
  if (CurrentComponent === undefined) {
    setSelectedTabId("informations");
    CurrentComponent = Dummy;
  }

  return (
    <AccountContentWrapper
      title={`${company.name}${
        company.givenName ? " - " + company.givenName : ""
      }`}
      showTitle
      subtitle={company.orgId}
      additional={
        <>
          {company.isDormantSince && (
            <Badge severity="warning">Établissement en sommeil</Badge>
          )}
          {userRole(company.userRole!)}
        </>
      }
    >
      <div id="company-tab-content" tabIndex={-1}>
        <Tabs
          selectedTabId={selectedTabId}
          tabs={tabs}
          onTabChange={setSelectedTabId}
        >
          <CurrentComponent company={company} />
        </Tabs>
      </div>
    </AccountContentWrapper>
  );
}
