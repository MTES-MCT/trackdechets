import { gql, useQuery } from "@apollo/client";
import { useNotifier } from "../../../dashboard/components/BSDList/useNotifier";
import { CompanyType } from "@td/codegen-ui";
import { useMemo } from "react";

const hasTransporterProfile = companyTypes =>
  companyTypes.includes(CompanyType.Transporter);

const GET_BSDS_COUNT_FOR_TRANSPORT_TABS = gql`
  query GetBsdsCountForTransportTabs($siret: [String!]) {
    bsdsToCollect: bsds(first: 1, where: { isToCollectFor: $siret }) {
      totalCount
    }
    bsdsCollected: bsds(first: 1, where: { isCollectedFor: $siret }) {
      totalCount
    }
  }
`;

export const useShowTransportTabs = (companyTypes, companySiret) => {
  const isTransporter = hasTransporterProfile(companyTypes);

  const { data, loading, refetch } = useQuery(
    GET_BSDS_COUNT_FOR_TRANSPORT_TABS,
    {
      skip: isTransporter,
      variables: { siret: [companySiret] },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true
    }
  );

  useNotifier(companySiret, () => {
    if (!isTransporter) {
      refetch();
    }
  });

  const showTransportTabs = useMemo(() => {
    if (isTransporter) return true;
    return (
      (data?.bsdsToCollect?.totalCount ?? 0) > 0 ||
      (data?.bsdsCollected?.totalCount ?? 0) > 0
    );
  }, [isTransporter, data]);

  return { showTransportTabs, loading };
};
