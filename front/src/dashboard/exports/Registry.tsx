import { gql, useQuery } from "@apollo/client";
import React from "react";
import ExportsForm from "./ExportsForm";
import { Query } from "@td/codegen-ui";
import { Loader } from "../../Apps/common/Components";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import RegistryMenu from "./RegistryMenu";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        userRole
        siret
        orgId
        companyTypes
        userPermissions
        securityCode
      }
    }
  }
`;

Exports.fragments = {
  company: gql`
    fragment ExportsCompanyFragment on CompanyPrivate {
      ...ExportsFormCompanyFragment
    }
    ${ExportsForm.fragments.company}
  `
};

export default function Exports() {
  const { data, loading, error } = useQuery<Pick<Query, "me">>(GET_ME);

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  const companies = data?.me.companies ?? [];

  return (
    <div id="companies" className="companies dashboard">
      {!isMobile && <RegistryMenu />}
      <div className="dashboard-content">
        <div className="tw-p-6">
          <h2 className="h2 tw-mb-4">Exporter un registre</h2>
          <ExportsForm companies={companies} />
        </div>
      </div>
    </div>
  );
}
