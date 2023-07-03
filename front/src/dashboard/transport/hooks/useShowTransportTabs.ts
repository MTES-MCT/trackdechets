import { useQuery } from "@apollo/client";
import { GET_BSDS } from "Apps/common/queries";
import { useNotifier } from "dashboard/components/BSDList/useNotifier";
import { CompanyType, Query, QueryBsdsArgs } from "generated/graphql/types";

const isTransporter = companyTypes =>
  companyTypes.includes(CompanyType.Transporter);

const hasBsds = (loading, data) => {
  return (
    !loading && Boolean(data?.bsds?.totalCount) && data?.bsds?.totalCount > 0
  );
};

export const useShowTransportTabs = (companyTypes, companySiret) => {
  const {
    loading: loadingIsToCollectForData,
    data: isToCollectForData,
    refetch: refetchIsToCollectForData,
  } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
    skip: isTransporter(companyTypes),
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      first: 1,
      where: { isToCollectFor: [companySiret] },
    },
  });

  const {
    loading: loadingIsCollectedForData,
    data: isCollectedForData,
    refetch: refetchIsCollectedForData,
  } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
    skip: isTransporter(companyTypes),
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      first: 1,
      where: { isToCollectFor: [companySiret] },
    },
  });

  useNotifier(companySiret, refetchIsToCollectForData);
  useNotifier(companySiret, refetchIsCollectedForData);

  return {
    showTransportTabs:
      isTransporter(companyTypes) ||
      hasBsds(loadingIsToCollectForData, isToCollectForData) ||
      hasBsds(loadingIsCollectedForData, isCollectedForData),
  };
};
