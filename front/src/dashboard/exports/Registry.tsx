import { gql, useQuery } from "@apollo/client";
import React from "react";
import ExportsForm from "./ExportsForm";
import { Query } from "@td/codegen-ui";
import { Loader } from "../../Apps/common/Components";
import { InlineError } from "../../Apps/common/Components/Error/Error";

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

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  const companies = data?.me.companies ?? [];

  return (
    <div className="fr-mx-2w">
      <ExportsForm companies={companies} />
    </div>
  );
}
