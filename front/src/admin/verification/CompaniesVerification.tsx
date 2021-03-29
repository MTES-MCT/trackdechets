import { useQuery } from "@apollo/client";
import Loader from "common/components/Loaders";
import {
  QueryCompaniesForVerificationArgs,
  Query,
} from "generated/graphql/types";
import React from "react";
import CompaniesVerificationTable from "./CompaniesVerificationTable";
import { COMPANIES_FOR_VERIFICATION } from "./queries";

const pageSize = 50;

/**
 * Component used to verify new companies manually
 */
export default function CompaniesVerification() {
  const { data, loading, refetch } = useQuery<
    Pick<Query, "companiesForVerification">,
    Partial<QueryCompaniesForVerificationArgs>
  >(COMPANIES_FOR_VERIFICATION, {
    variables: { first: pageSize, skip: 0 },
  });

  const fetchData = React.useCallback(
    ({ pageSize, pageIndex, filters }) => {
      const verificationStatus = filters.find(
        f => f.id === "verificationStatus"
      );
      const where = {} as any;
      if (verificationStatus) {
        where["verificationStatus"] = verificationStatus.value;
      }
      refetch({ first: pageSize, skip: pageIndex * pageSize, where });
    },
    [refetch]
  );

  if (loading) {
    return <Loader />;
  }

  if (data) {
    const totalCount = data.companiesForVerification?.totalCount ?? 0;
    return (
      <CompaniesVerificationTable
        data={data.companiesForVerification?.companies}
        loading={loading}
        pageSize={pageSize}
        totalCount={totalCount}
        fetchData={fetchData}
      />
    );
  }

  return null;
}
