import { useQuery } from "@apollo/client";
import { GET_BSDS } from "../../common/queries";
import { useNotifier } from "../../../dashboard/components/BSDList/useNotifier";
import { CompanyType, Query, QueryBsdsArgs } from "codegen-ui";

const hasTransporterProfile = companyTypes =>
  companyTypes.includes(CompanyType.Transporter);

const hasBsds = (loading, data) => {
  return (
    !loading && Boolean(data?.bsds?.totalCount) && data?.bsds?.totalCount > 0
  );
};

export const useShowTransportTabs = (companyTypes, companySiret) => {
  const isTransporter = hasTransporterProfile(companyTypes);

  const {
    loading: loadingIsToCollectForData,
    data: isToCollectForData,
    refetch: refetchIsToCollectForData
  } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
    skip: isTransporter,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      first: 1,
      where: { isToCollectFor: [companySiret] }
    }
  });

  const {
    loading: loadingIsCollectedForData,
    data: isCollectedForData,
    refetch: refetchIsCollectedForData
  } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
    skip: isTransporter,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      first: 1,
      where: { isCollectedFor: [companySiret] }
    }
  });

  useNotifier(companySiret, () => {
    if (!isTransporter) refetchIsToCollectForData();
  });
  useNotifier(companySiret, () => {
    if (!isTransporter) refetchIsCollectedForData();
  });

  return {
    showTransportTabs:
      isTransporter ||
      hasBsds(loadingIsToCollectForData, isToCollectForData) ||
      hasBsds(loadingIsCollectedForData, isCollectedForData)
  };
};
