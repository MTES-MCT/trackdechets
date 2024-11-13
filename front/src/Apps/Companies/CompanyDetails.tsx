import React, { useState } from "react";
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
import { Navigate, useParams } from "react-router-dom";
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
import { CompanyRegistryDelegation } from "./CompanyRegistryDelegation/CompanyRegistryDelegation";

export type TabContentProps = {
  company: CompanyPrivate;
};

const REGISTRY_V2_FLAG = "REGISTRY_V2";

const buildTabs = (
  company: CompanyPrivate
): {
  tabs: TabsProps.Controlled["tabs"];
  tabsContent: Record<string, React.FC<TabContentProps>>;
} => {
  const isAdmin = company.userRole === UserRole.Admin;

  // RNDTS features protected by feature flag
  const canViewRndtsFeatures = company.featureFlags.includes(REGISTRY_V2_FLAG);

  const iconId = "fr-icon-checkbox-line" as FrIconClassName;
  const tabs = [
    {
      tabId: "tab1",
      label: "Informations",
      iconId
    },
    {
      tabId: "tab2",
      label: "Signature",
      iconId
    },
    {
      tabId: "tab3",
      label: "Membres",
      iconId
    },
    {
      tabId: "tab4",
      label: "Contact",
      iconId
    },
    {
      tabId: "tab5",
      label: "Fiche",
      iconId
    }
  ];
  const tabsContent = {
    tab1: CompanyInfo,
    tab2: CompanySignature,
    tab3: CompanyMembers,
    tab4: CompanyContactForm,
    tab5: CompanyDigestSheetForm
  };
  if (canViewRndtsFeatures) {
    tabs.push({
      tabId: "tab6",
      label: "Délégations",
      iconId
    });
    tabsContent["tab6"] = CompanyRegistryDelegation;
  }
  if (isAdmin) {
    tabs.push({
      tabId: "tab7",
      label: "Avancé",
      iconId
    });
    tabsContent["tab7"] = CompanyAdvanced;
  }

  return { tabs, tabsContent };
};

const Dummy = () => <p></p>;

export default function CompanyDetails() {
  const { siret } = useParams<{ siret: string }>();
  const [selectedTabId, setSelectedTabId] = useState("tab1");

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
  const company = companies && companies[0];

  if (!company) {
    return <Navigate to={{ pathname: routes.companies.index }} />;
  }

  const { tabs, tabsContent } = buildTabs(company);

  const CurrenComponent = tabsContent[selectedTabId] ?? Dummy;
  return (
    <AccountContentWrapper
      title={`${company.name}${
        company.givenName ? " - " + company.givenName : ""
      }`}
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
          <CurrenComponent company={company} />
        </Tabs>
      </div>
    </AccountContentWrapper>
  );
}
