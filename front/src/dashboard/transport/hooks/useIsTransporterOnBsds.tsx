import { useQuery } from "@apollo/client";
import { Query } from "@testing-library/dom";
import { GET_BSDS } from "Apps/common/queries";
import { CompanyType, QueryBsdsArgs } from "generated/graphql/types";

const isTransporter = companyTypes =>
  companyTypes.includes(CompanyType.Transporter);

export const useIsTransporterOnBsds = (companyTypes, siret) => {
  const { loading, data } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    GET_BSDS,
    {
      skip: isTransporter(companyTypes),
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
      variables: {
        first: 1,
        where: {
          _or: [{ isToCollectFor: [siret] }, { isCollectedFor: [siret] }],
        },
      },
    }
  );

  console.log("data", JSON.stringify(data, null, 4));

  return {
    loading,
    isTransporterOnBsds:
      isTransporter(companyTypes) || data?.bsds?.totalCount > 0,
  };
};
